
import { supabase } from '@/integrations/supabase/client';
import { cachedSupabase } from '@/integrations/supabase/cacheClient';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { RecurrenceOptions, RecurrenceRuleData, ExpandedRecurrenceEvent } from '@/types/recurrence';
import { DateTime } from 'luxon';
import { RRule, RRuleSet, rrulestr } from 'rrule';

// Cache TTL configuration (in milliseconds)
const CACHE_CONFIG = {
  SHORT: 2 * 60 * 1000,  // 2 minutes for frequently changing data
  MEDIUM: 10 * 60 * 1000, // 10 minutes for moderately changing data
  LONG: 30 * 60 * 1000   // 30 minutes for rarely changing data
};

/**
 * Service for working with recurrence rules and patterns
 * Centralizes recurrence functionality for availability and appointments
 */
export class RecurrenceService {
  /**
   * Create a recurrence rule in the database
   * @param eventId The ID of the event this recurrence rule applies to
   * @param options Options for the recurrence rule
   * @returns The created recurrence rule data
   */
  static async createRecurrenceRule(
    eventId: string,
    options: RecurrenceOptions
  ): Promise<RecurrenceRuleData> {
    try {
      const rrule = this.buildRRule(options);
      
      // Insert the recurrence rule into the database
      const { data, error } = await supabase
        .from('recurrence_rules')
        .insert({
          event_id: eventId,
          rrule: rrule.toString()
        })
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      return data as RecurrenceRuleData;
    } catch (error) {
      console.error('[RecurrenceService] Error creating recurrence rule:', error);
      throw error;
    }
  }
  
  /**
   * Update a recurrence rule in the database
   * @param recurrenceId The ID of the recurrence rule to update
   * @param options Options for the recurrence rule
   * @returns The updated recurrence rule data
   */
  static async updateRecurrenceRule(
    recurrenceId: string,
    options: RecurrenceOptions
  ): Promise<RecurrenceRuleData> {
    try {
      const rrule = this.buildRRule(options);
      
      // Update the recurrence rule in the database
      const { data, error } = await supabase
        .from('recurrence_rules')
        .update({
          rrule: rrule.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recurrenceId)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      return data as RecurrenceRuleData;
    } catch (error) {
      console.error('[RecurrenceService] Error updating recurrence rule:', error);
      throw error;
    }
  }
  
  /**
   * Delete a recurrence rule from the database
   * @param recurrenceId The ID of the recurrence rule to delete
   * @returns True if the deletion was successful
   */
  static async deleteRecurrenceRule(recurrenceId: string): Promise<boolean> {
    try {
      // Delete the recurrence rule from the database
      const { error } = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('id', recurrenceId);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('[RecurrenceService] Error deleting recurrence rule:', error);
      throw error;
    }
  }
  
  /**
   * Get a recurrence rule by its ID
   * @param recurrenceId The ID of the recurrence rule to get
   * @returns The recurrence rule data
   */
  static async getRecurrenceRule(recurrenceId: string): Promise<RecurrenceRuleData> {
    try {
      // Fetch the recurrence rule from the database with caching
      const { data, error } = await cachedSupabase.query<RecurrenceRuleData>(
        'recurrence_rules',
        (client) => client
          .from('recurrence_rules')
          .select('*')
          .eq('id', recurrenceId)
          .single(),
        { ttl: CACHE_CONFIG.MEDIUM }
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[RecurrenceService] Error getting recurrence rule:', error);
      throw error;
    }
  }
  
  /**
   * Get recurrence rules for an event
   * @param eventId The ID of the event to get recurrence rules for
   * @returns The recurrence rule data
   */
  static async getRecurrenceRuleForEvent(eventId: string): Promise<RecurrenceRuleData | null> {
    try {
      // Fetch the recurrence rule from the database with caching
      const { data, error } = await cachedSupabase.query<RecurrenceRuleData>(
        'recurrence_rules',
        (client) => client
          .from('recurrence_rules')
          .select('*')
          .eq('event_id', eventId)
          .maybeSingle(),
        { ttl: CACHE_CONFIG.MEDIUM }
      );
      
      if (error) {
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('[RecurrenceService] Error getting recurrence rule for event:', error);
      return null;
    }
  }
  
  /**
   * Expand a recurring event into individual occurrences within a date range
   * @param baseEvent The base event to expand
   * @param startDate The start date for the expansion range
   * @param endDate The end date for the expansion range
   * @param timezone The timezone for date calculations
   * @returns Array of expanded events
   */
  static async expandRecurringEvent(
    baseEvent: DatabaseCalendarEvent,
    startDate: Date,
    endDate: Date,
    timezone: string
  ): Promise<DatabaseCalendarEvent[]> {
    try {
      // If the event doesn't have a recurrence_id, just return the base event
      if (!baseEvent.recurrence_id) {
        return [baseEvent];
      }
      
      // Fetch the recurrence rule
      const recurrenceRule = await this.getRecurrenceRule(baseEvent.recurrence_id);
      if (!recurrenceRule) {
        return [baseEvent];
      }
      
      // Parse the RRule
      const rruleObj = rrulestr(recurrenceRule.rrule);
      
      // Calculate the occurrences within the date range
      const occurrences = rruleObj.between(
        startDate,
        endDate,
        true // inclusive
      );
      
      // Create events for each occurrence
      const events: DatabaseCalendarEvent[] = [];
      
      // Parse the base event start/end times
      const baseStartDateTime = DateTime.fromISO(baseEvent.start_time);
      const baseEndDateTime = DateTime.fromISO(baseEvent.end_time);
      const duration = baseEndDateTime.diff(baseStartDateTime);
      
      for (const occurrence of occurrences) {
        // Create new start/end times for this occurrence
        const occurrenceDate = DateTime.fromJSDate(occurrence, { zone: timezone });
        const occurrenceStartTime = occurrenceDate.set({
          hour: baseStartDateTime.hour,
          minute: baseStartDateTime.minute,
          second: baseStartDateTime.second
        });
        const occurrenceEndTime = occurrenceStartTime.plus(duration);
        
        // Create a new event for this occurrence
        const occurrenceEvent: DatabaseCalendarEvent = {
          ...baseEvent,
          id: `${baseEvent.id}_${occurrenceDate.toFormat('yyyyMMdd')}`, // Generate a unique ID
          start_time: occurrenceStartTime.toISO(),
          end_time: occurrenceEndTime.toISO()
        };
        
        events.push(occurrenceEvent);
      }
      
      return events;
    } catch (error) {
      console.error('[RecurrenceService] Error expanding recurring event:', error);
      return [baseEvent]; // Fallback to just the base event
    }
  }
  
  /**
   * Build an RRule object from options
   * @param options Options for the recurrence rule
   * @returns RRule object
   */
  static buildRRule(options: RecurrenceOptions): RRule {
    try {
      const {
        frequency,
        interval = 1,
        byDay = [],
        count,
        until,
        startDate
      } = options;
      
      // Prepare options for the RRule constructor
      const rruleOptions: any = {
        freq: RRule[frequency],
        interval,
        dtstart: startDate
      };
      
      // Add byweekday if provided
      if (byDay && byDay.length > 0) {
        rruleOptions.byweekday = byDay.map(day => {
          switch (day) {
            case 'MO': return RRule.MO;
            case 'TU': return RRule.TU;
            case 'WE': return RRule.WE;
            case 'TH': return RRule.TH;
            case 'FR': return RRule.FR;
            case 'SA': return RRule.SA;
            case 'SU': return RRule.SU;
            default: return RRule.MO; // Default to Monday
          }
        });
      }
      
      // Add count if provided
      if (count) {
        rruleOptions.count = count;
      }
      
      // Add until if provided
      if (until) {
        const untilDate = typeof until === 'string' ? new Date(until) : until;
        rruleOptions.until = untilDate;
      }
      
      return new RRule(rruleOptions);
    } catch (error) {
      console.error('[RecurrenceService] Error building RRule:', error);
      throw error;
    }
  }
  
  /**
   * Parse an RRule string into its components
   * @param rruleStr The RRule string to parse
   * @returns Parsed options
   */
  static parseRRule(rruleStr: string): Partial<RecurrenceOptions> {
    try {
      const rule = rrulestr(rruleStr);
      const options = rule.options;
      
      // Convert RRule frequency constants back to strings
      let frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'WEEKLY';
      if (options.freq === RRule.DAILY) frequency = 'DAILY';
      else if (options.freq === RRule.WEEKLY) frequency = 'WEEKLY';
      else if (options.freq === RRule.MONTHLY) frequency = 'MONTHLY';
      else if (options.freq === RRule.YEARLY) frequency = 'YEARLY';
      
      // Extract byDay information
      const byDay: string[] = [];
      if (options.byweekday) {
        options.byweekday.forEach((day: number) => {
          if (day === 0) byDay.push('MO');
          else if (day === 1) byDay.push('TU');
          else if (day === 2) byDay.push('WE');
          else if (day === 3) byDay.push('TH');
          else if (day === 4) byDay.push('FR');
          else if (day === 5) byDay.push('SA');
          else if (day === 6) byDay.push('SU');
        });
      }
      
      return {
        frequency,
        interval: options.interval,
        byDay,
        count: options.count,
        until: options.until ? new Date(options.until) : undefined,
        startDate: options.dtstart,
        timezone: 'UTC' // Default timezone
      };
    } catch (error) {
      console.error('[RecurrenceService] Error parsing RRule:', error);
      throw error;
    }
  }
  
  /**
   * Create a weekly recurrence rule
   * @param startDate The start date of the first occurrence
   * @param daysOfWeek Array of days of the week (MO, TU, etc.)
   * @param interval The interval between recurrences
   * @param options Additional options
   * @returns RRule object
   */
  static createWeeklyRecurrence(
    startDate: Date,
    daysOfWeek: string[],
    interval: number = 1,
    options: { count?: number, until?: Date, timezone?: string } = {}
  ): RRule {
    return this.buildRRule({
      frequency: 'WEEKLY',
      interval,
      byDay: daysOfWeek,
      count: options.count,
      until: options.until,
      startDate,
      timezone: options.timezone || 'UTC'
    });
  }
  
  /**
   * Check if a date falls within a recurrence pattern
   * @param date The date to check
   * @param rruleStr The RRule string to check against
   * @param timezone The timezone for date calculations
   * @returns True if the date is in the recurrence pattern
   */
  static isDateInRecurrencePattern(
    date: Date | string,
    rruleStr: string,
    timezone: string = 'UTC'
  ): boolean {
    try {
      // Convert date to a JS Date if it's a string
      const jsDate = typeof date === 'string' ? new Date(date) : date;
      
      // Parse the RRule
      const rule = rrulestr(rruleStr);
      
      // Check if the date is in the pattern
      const dateMatches = rule.between(
        new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate(), 0, 0, 0),
        new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate(), 23, 59, 59),
        true
      );
      
      return dateMatches.length > 0;
    } catch (error) {
      console.error('[RecurrenceService] Error checking if date is in pattern:', error);
      return false;
    }
  }
  
  /**
   * Get the next occurrence of a recurring event after a specific date
   * @param rruleStr The RRule string to check
   * @param afterDate The date to find occurrences after
   * @param timezone The timezone for date calculations
   * @returns The next occurrence date or null if none found
   */
  static getNextOccurrence(
    rruleStr: string,
    afterDate: Date | string,
    timezone: string = 'UTC'
  ): Date | null {
    try {
      // Convert date to a JS Date if it's a string
      const jsDate = typeof afterDate === 'string' ? new Date(afterDate) : afterDate;
      
      // Parse the RRule
      const rule = rrulestr(rruleStr);
      
      // Get the next occurrence
      const nextOccurrence = rule.after(jsDate);
      
      return nextOccurrence || null;
    } catch (error) {
      console.error('[RecurrenceService] Error getting next occurrence:', error);
      return null;
    }
  }
  
  /**
   * Invalidate cache for recurrence data
   * @param clinicianId Optional clinician ID to target specific entries
   */
  static invalidateCache(clinicianId?: string): void {
    cachedSupabase.invalidateTable('recurrence_rules');
    console.log(`[RecurrenceService] Invalidated cache ${clinicianId ? `for clinician: ${clinicianId}` : ''}`);
  }
}
