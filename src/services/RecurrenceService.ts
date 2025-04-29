
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timezone';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { DateTime } from 'luxon';

/**
 * RecurrenceOptions interface for configuring recurrence rules
 */
export interface RecurrenceOptions {
  frequency: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
  interval?: number;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
  count?: number;
  until?: Date;
  startDate: Date;
  timezone: string;
}

export class RecurrenceService {
  /**
   * Get recurrence rule by event ID
   */
  static async getRuleByEventId(eventId: string): Promise<{
    data: any[];
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .select('*')
        .eq('event_id', eventId);
      
      return { 
        data: result.data || [], 
        error: result.error 
      };
    } catch (error) {
      console.error('[RecurrenceService] Error fetching recurrence rule:', error);
      return { data: [], error };
    }
  }

  /**
   * Get all recurrence rules
   */
  static async getRecurringRules(): Promise<{
    data: any[];
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .select('*');
      
      return { 
        data: result.data || [], 
        error: result.error 
      };
    } catch (error) {
      console.error('[RecurrenceService] Error fetching recurrence rules:', error);
      return { data: [], error };
    }
  }

  /**
   * Create a new recurrence rule
   */
  static async createRule(eventId: string, rule: string): Promise<{
    data: any | null;
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .insert([
          {
            event_id: eventId,
            rule_string: rule,
            is_active: true
          }
        ])
        .select()
        .single();
      
      return {
        data: result.data,
        error: result.error
      };
    } catch (error) {
      console.error('[RecurrenceService] Error creating recurrence rule:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing recurrence rule
   */
  static async updateRule(ruleId: string, rule: string): Promise<{
    data: any | null;
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .update({
          rule_string: rule,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();
      
      return {
        data: result.data,
        error: result.error
      };
    } catch (error) {
      console.error('[RecurrenceService] Error updating recurrence rule:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a recurrence rule
   */
  static async deleteRule(ruleId: string): Promise<{
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('id', ruleId);
      
      return { error: result.error };
    } catch (error) {
      console.error('[RecurrenceService] Error deleting recurrence rule:', error);
      return { error };
    }
  }

  /**
   * Delete a recurrence rule by event ID
   */
  static async deleteRuleByEventId(eventId: string): Promise<{
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('event_id', eventId);
      
      return { error: result.error };
    } catch (error) {
      console.error('[RecurrenceService] Error deleting recurrence rule by event ID:', error);
      return { error };
    }
  }

  /**
   * Build an RFC-5545 compliant recurrence rule (iCalendar)
   */
  static buildRRule(options: RecurrenceOptions): string {
    try {
      const rruleOptions: any = {
        freq: RRule[options.frequency],
        dtstart: options.startDate
      };
      
      if (options.interval) {
        rruleOptions.interval = options.interval;
      }
      
      if (options.byDay && options.byDay.length > 0) {
        rruleOptions.byweekday = options.byDay.map(day => RRule[day]);
      }
      
      if (options.byMonth && options.byMonth.length > 0) {
        rruleOptions.bymonth = options.byMonth;
      }
      
      if (options.byMonthDay && options.byMonthDay.length > 0) {
        rruleOptions.bymonthday = options.byMonthDay;
      }
      
      if (options.count) {
        rruleOptions.count = options.count;
      }
      
      if (options.until) {
        rruleOptions.until = options.until;
      }
      
      return new RRule(rruleOptions).toString();
    } catch (error) {
      console.error('[RecurrenceService] Error building RRule:', error);
      throw error;
    }
  }

  /**
   * Parse an RFC-5545 compliant recurrence rule (iCalendar)
   */
  static parseRRule(rruleStr: string, dtstart?: Date): RRule {
    try {
      const options: any = {
        dtstart: dtstart || new Date()
      };
      
      return rrulestr(rruleStr, options) as RRule;
    } catch (error) {
      console.error('[RecurrenceService] Error parsing RRule:', error);
      throw error;
    }
  }

  /**
   * Create a weekly recurrence rule for a specific day of week
   */
  static createWeeklyRecurrence(dayOfWeek: string, startDate: Date, timezone: string): string {
    try {
      const options: RecurrenceOptions = {
        frequency: 'WEEKLY',
        byDay: [dayOfWeek],
        startDate: startDate,
        timezone: timezone
      };
      
      return this.buildRRule(options);
    } catch (error) {
      console.error('[RecurrenceService] Error creating weekly recurrence:', error);
      throw error;
    }
  }

  /**
   * Check if a date falls within a recurrence pattern
   */
  static isDateInRecurrencePattern(date: Date, rruleStr: string, timezone: string): boolean {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const rule = this.parseRRule(rruleStr);
      
      // Set time components to zero for date-only comparison
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Get all occurrences between the day before and day after
      const dayBefore = new Date(targetDate);
      dayBefore.setDate(targetDate.getDate() - 1);
      
      const dayAfter = new Date(targetDate);
      dayAfter.setDate(targetDate.getDate() + 1);
      
      const occurrences = rule.between(dayBefore, dayAfter, true);
      
      // Check if any occurrence is on the target date
      return occurrences.some(occurrence => {
        const occurrenceDate = new Date(occurrence);
        return occurrenceDate.getDate() === targetDate.getDate() &&
               occurrenceDate.getMonth() === targetDate.getMonth() &&
               occurrenceDate.getFullYear() === targetDate.getFullYear();
      });
    } catch (error) {
      console.error('[RecurrenceService] Error checking date in pattern:', error);
      return false;
    }
  }

  /**
   * Get the next occurrence after a given date
   */
  static getNextOccurrence(rruleStr: string, after: Date, timezone: string): Date | null {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const rule = this.parseRRule(rruleStr);
      
      // Get the next occurrence after the specified date
      const nextOccurrences = rule.after(after);
      
      return nextOccurrences || null;
    } catch (error) {
      console.error('[RecurrenceService] Error getting next occurrence:', error);
      return null;
    }
  }

  /**
   * Expand a recurring event to individual occurrences
   */
  static async expandRecurringEvent(
    baseEvent: any,
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): Promise<any[]> {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
    
    // Get the recurrence rule for this event
    const { data: rules } = await this.getRuleByEventId(baseEvent.id);
    if (!rules || rules.length === 0) {
      return [baseEvent]; // No recurrence rule, return the base event only
    }
    
    const rruleStr = rules[0].rule_string;
    const rule = this.parseRRule(rruleStr, new Date(baseEvent.start_time));
    
    // Convert dates to DateTime objects
    const startDt = typeof startDate === 'string' ? 
      TimeZoneService.parseWithZone(startDate, validTimeZone) :
      DateTime.fromJSDate(startDate, { zone: validTimeZone });
      
    const endDt = typeof endDate === 'string' ?
      TimeZoneService.parseWithZone(endDate, validTimeZone) :
      DateTime.fromJSDate(endDate, { zone: validTimeZone });
    
    // Get event duration
    const baseStartTime = DateTime.fromISO(baseEvent.start_time, { zone: 'UTC' });
    const baseEndTime = DateTime.fromISO(baseEvent.end_time, { zone: 'UTC' });
    const duration = baseEndTime.diff(baseStartTime);
    
    // Convert DateTime objects to JS Dates for RRule
    const startJsDate = startDt.toJSDate();
    const endJsDate = endDt.toJSDate();
    
    // Get all occurrences between the start and end dates
    const occurrences = rule.between(startJsDate, endJsDate, true);
    
    // Create an expanded event for each occurrence
    return occurrences.map((date, index) => {
      const occurrenceStart = DateTime.fromJSDate(date, { zone: 'UTC' });
      const occurrenceEnd = occurrenceStart.plus(duration);
      
      return {
        ...baseEvent,
        id: `${baseEvent.id}_${index}`,
        start_time: occurrenceStart.toUTC().toISO(),
        end_time: occurrenceEnd.toUTC().toISO(),
        is_recurring_instance: true
      };
    });
  }

  /**
   * Invalidate recurrence cache for an event
   */
  static invalidateCache(eventId: string): void {
    // Implementation for cache invalidation
    console.log(`[RecurrenceService] Invalidating cache for event: ${eventId}`);
    // In a real implementation, this would clear any cached recurrence data
  }
}
