import { DateTime } from 'luxon';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { supabase } from '@/integrations/supabase/client';
import { cachedSupabase } from '@/integrations/supabase/cacheClient';
import { TimeZoneService } from '@/utils/timezone';
import { CalendarEvent } from '@/types/calendar';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarErrorHandler } from './calendar/CalendarErrorHandler';

// Cache configuration for recurrence patterns
const RECURRENCE_CACHE_CONFIG = {
  PATTERN: 30 * 60 * 1000,  // 30 minutes for recurrence patterns
  EXPANSION: 10 * 60 * 1000, // 10 minutes for expanded instances
};

// Interface for recurrence rule
export interface RecurrenceRule {
  id: string;
  event_id: string;
  rrule: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for recurrence options
export interface RecurrenceOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
  count?: number;
  until?: Date | string;
  startDate: Date | string;
  timezone: string;
}

/**
 * RecurrenceService - Centralized service for handling recurrence patterns
 * Provides methods for creating, expanding, and modifying recurring events
 * Implements caching for better performance
 */
export class RecurrenceService {
  /**
   * Create a recurrence rule for an event
   * @param eventId The ID of the event to create a recurrence rule for
   * @param options The recurrence options
   * @returns The created recurrence rule
   */
  static async createRecurrenceRule(
    eventId: string,
    options: RecurrenceOptions
  ): Promise<RecurrenceRule> {
    try {
      const rrule = this.buildRRule(options);
      
      console.log('[RecurrenceService] Creating recurrence rule:', {
        eventId,
        rrule
      });
      
      const { data, error } = await supabase
        .from('recurrence_rules')
        .insert([{
          event_id: eventId,
          rrule
        }])
        .select('*');
        
      if (error) {
        console.error('[RecurrenceService] Error creating recurrence rule:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from recurrence rule creation');
      }
      
      // Invalidate cache for this event
      this.invalidateCache(eventId);
      
      return data[0] as RecurrenceRule;
    } catch (error) {
      console.error('[RecurrenceService] Error in createRecurrenceRule:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get a recurrence rule by event ID
   * @param eventId The ID of the event
   * @returns The recurrence rule for the event
   */
  static async getRecurrenceRuleByEventId(eventId: string): Promise<RecurrenceRule | null> {
    try {
      const cacheKey = `recurrence_rule:${eventId}`;
      
      const { data, error, fromCache } = await cachedSupabase.query<RecurrenceRule[]>(
        'recurrence_rules',
        (client) => client
          .from('recurrence_rules')
          .select('*')
          .eq('event_id', eventId)
          .limit(1),
        { ttl: RECURRENCE_CACHE_CONFIG.PATTERN }
      );
      
      if (error) {
        console.error('[RecurrenceService] Error fetching recurrence rule:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      console.log(`[RecurrenceService] Retrieved recurrence rule for event ${eventId} (from cache: ${fromCache})`);
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('[RecurrenceService] Error in getRecurrenceRuleByEventId:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get a recurrence rule by ID
   * @param recurrenceId The ID of the recurrence rule
   * @returns The recurrence rule
   */
  static async getRecurrenceRuleById(recurrenceId: string): Promise<RecurrenceRule | null> {
    try {
      const cacheKey = `recurrence_rule_id:${recurrenceId}`;
      
      const { data, error, fromCache } = await cachedSupabase.query<RecurrenceRule[]>(
        'recurrence_rules',
        (client) => client
          .from('recurrence_rules')
          .select('*')
          .eq('id', recurrenceId)
          .limit(1),
        { ttl: RECURRENCE_CACHE_CONFIG.PATTERN }
      );
      
      if (error) {
        console.error('[RecurrenceService] Error fetching recurrence rule by ID:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      console.log(`[RecurrenceService] Retrieved recurrence rule ${recurrenceId} (from cache: ${fromCache})`);
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('[RecurrenceService] Error in getRecurrenceRuleById:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Update a recurrence rule
   * @param recurrenceId The ID of the recurrence rule to update
   * @param options The new recurrence options
   * @returns The updated recurrence rule
   */
  static async updateRecurrenceRule(
    recurrenceId: string,
    options: RecurrenceOptions
  ): Promise<RecurrenceRule> {
    try {
      const rrule = this.buildRRule(options);
      
      console.log('[RecurrenceService] Updating recurrence rule:', {
        recurrenceId,
        rrule
      });
      
      const { data, error } = await supabase
        .from('recurrence_rules')
        .update({ rrule })
        .eq('id', recurrenceId)
        .select('*');
        
      if (error) {
        console.error('[RecurrenceService] Error updating recurrence rule:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from recurrence rule update');
      }
      
      // Invalidate cache for this recurrence rule
      this.invalidateCacheByRecurrenceId(recurrenceId);
      
      return data[0] as RecurrenceRule;
    } catch (error) {
      console.error('[RecurrenceService] Error in updateRecurrenceRule:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Delete a recurrence rule
   * @param recurrenceId The ID of the recurrence rule to delete
   * @returns True if the deletion was successful
   */
  static async deleteRecurrenceRule(recurrenceId: string): Promise<boolean> {
    try {
      console.log('[RecurrenceService] Deleting recurrence rule:', recurrenceId);
      
      // Get the recurrence rule first to know the event ID for cache invalidation
      const recurrenceRule = await this.getRecurrenceRuleById(recurrenceId);
      
      const { error } = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('id', recurrenceId);
        
      if (error) {
        console.error('[RecurrenceService] Error deleting recurrence rule:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      // Invalidate cache for this recurrence rule
      this.invalidateCacheByRecurrenceId(recurrenceId);
      
      // Also invalidate cache for the event if we found it
      if (recurrenceRule) {
        this.invalidateCache(recurrenceRule.event_id);
      }
      
      return true;
    } catch (error) {
      console.error('[RecurrenceService] Error in deleteRecurrenceRule:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Expand a recurring event into individual instances
   * @param baseEvent The base event to expand
   * @param startDate The start date for the expansion
   * @param endDate The end date for the expansion
   * @param timezone The timezone to use for the expansion
   * @returns An array of expanded event instances
   */
  static async expandRecurringEvent(
    baseEvent: DatabaseCalendarEvent,
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): Promise<DatabaseCalendarEvent[]> {
    try {
      if (!baseEvent.recurrence_id) {
        return [baseEvent]; // Not a recurring event
      }
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Convert dates to DateTime objects
      const startDt = typeof startDate === 'string' ? 
        TimeZoneService.parseWithZone(startDate, validTimeZone) :
        TimeZoneService.createDateTime(startDate.toISOString().split('T')[0], '00:00:00', validTimeZone);
        
      const endDt = typeof endDate === 'string' ?
        TimeZoneService.parseWithZone(endDate, validTimeZone) :
        TimeZoneService.createDateTime(endDate.toISOString().split('T')[0], '23:59:59', validTimeZone);
      
      // Generate cache key based on event and date range
      const cacheKey = `expanded_event:${baseEvent.id}:${startDt.toISO()}:${endDt.toISO()}`;
      
      // Check cache first
      const cachedResult = this.getFromCache<DatabaseCalendarEvent[]>(cacheKey);
      if (cachedResult) {
        console.log(`[RecurrenceService] Using cached expansion for event ${baseEvent.id}`);
        return cachedResult;
      }
      
      // Get the recurrence rule
      const recurrenceRule = await this.getRecurrenceRuleById(baseEvent.recurrence_id);
      if (!recurrenceRule) {
        console.warn(`[RecurrenceService] No recurrence rule found for event ${baseEvent.id} with recurrence_id ${baseEvent.recurrence_id}`);
        return [baseEvent];
      }
      
      // Parse the base event start and end times
      const baseStart = TimeZoneService.parseWithZone(baseEvent.start_time, validTimeZone);
      const baseEnd = TimeZoneService.parseWithZone(baseEvent.end_time, validTimeZone);
      
      if (!baseStart.isValid || !baseEnd.isValid) {
        throw new Error(`Invalid base event times: ${!baseStart.isValid ? baseStart.invalidReason : baseEnd.invalidReason}`);
      }
      
      // Calculate the duration of the event
      const duration = baseEnd.diff(baseStart);
      
      // Parse the recurrence rule
      const rruleOptions = this.parseRRule(recurrenceRule.rrule, baseStart.toJSDate());
      
      // Get all occurrences in the date range
      const occurrences = rruleOptions.between(
        startDt.toJSDate(),
        endDt.toJSDate(),
        true // inclusive
      );
      
      // Generate expanded events
      const expandedEvents: DatabaseCalendarEvent[] = occurrences.map((date, index) => {
        const instanceStart = DateTime.fromJSDate(date, { zone: validTimeZone });
        const instanceEnd = instanceStart.plus(duration);
        
        return {
          ...baseEvent,
          id: `${baseEvent.id}_${index}`, // Generate a unique ID for the instance
          start_time: instanceStart.toUTC().toISO(),
          end_time: instanceEnd.toUTC().toISO(),
          is_recurring_instance: true
        };
      });
      
      // Store in cache
      this.storeInCache(cacheKey, expandedEvents, RECURRENCE_CACHE_CONFIG.EXPANSION);
      
      return expandedEvents;
    } catch (error) {
      console.error('[RecurrenceService] Error expanding recurring event:', error, {
        eventId: baseEvent.id,
        recurrenceId: baseEvent.recurrence_id
      });
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Build an RRule string from recurrence options
   * @param options The recurrence options
   * @returns An RRule string
   */
  static buildRRule(options: RecurrenceOptions): string {
    try {
      const {
        frequency,
        interval = 1,
        byDay = [],
        byMonthDay = [],
        byMonth = [],
        count,
        until,
        startDate,
        timezone
      } = options;
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Parse the start date
      const dtstart = typeof startDate === 'string' ?
        TimeZoneService.parseWithZone(startDate, validTimeZone).toJSDate() :
        startDate;
      
      // Build the RRule options
      const rruleOptions: any = {
        freq: RRule[frequency],
        interval,
        dtstart
      };
      
      // Add optional parameters if provided
      if (byDay.length > 0) {
        rruleOptions.byweekday = byDay.map(day => {
          switch (day) {
            case 'MO': return RRule.MO;
            case 'TU': return RRule.TU;
            case 'WE': return RRule.WE;
            case 'TH': return RRule.TH;
            case 'FR': return RRule.FR;
            case 'SA': return RRule.SA;
            case 'SU': return RRule.SU;
            default: throw new Error(`Invalid day: ${day}`);
          }
        });
      }
      
      if (byMonthDay.length > 0) {
        rruleOptions.bymonthday = byMonthDay;
      }
      
      if (byMonth.length > 0) {
        rruleOptions.bymonth = byMonth;
      }
      
      if (count) {
        rruleOptions.count = count;
      }
      
      if (until) {
        rruleOptions.until = typeof until === 'string' ?
          TimeZoneService.parseWithZone(until, validTimeZone).toJSDate() :
          until;
      }
      
      // Create the RRule and return as string
      const rule = new RRule(rruleOptions);
      return rule.toString();
    } catch (error) {
      console.error('[RecurrenceService] Error building RRule:', error);
      throw new Error(`Failed to build recurrence rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Parse an RRule string into an RRule object
   * @param rruleStr The RRule string to parse
   * @param dtstart The start date for the recurrence
   * @returns An RRule object
   */
  static parseRRule(rruleStr: string, dtstart?: Date): RRule {
    try {
      if (dtstart) {
        // If dtstart is provided, we need to create a new RRule with the provided dtstart
        const options = RRule.parseString(rruleStr);
        options.dtstart = dtstart;
        return new RRule(options);
      }
      
      // Otherwise, just parse the string
      return rrulestr(rruleStr) as RRule;
    } catch (error) {
      console.error('[RecurrenceService] Error parsing RRule:', error);
      throw new Error(`Failed to parse recurrence rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Create a simple weekly recurrence rule
   * @param dayOfWeek The day of week code (MO, TU, etc.)
   * @param startDate The start date for the recurrence
   * @param timezone The timezone to use
   * @returns An RRule string
   */
  static createWeeklyRecurrence(
    dayOfWeek: string,
    startDate: Date | string,
    timezone: string
  ): string {
    return this.buildRRule({
      frequency: 'WEEKLY',
      byDay: [dayOfWeek],
      startDate,
      timezone
    });
  }
  
  /**
   * Check if a date is part of a recurrence pattern
   * @param date The date to check
   * @param rruleStr The RRule string
   * @param timezone The timezone to use
   * @returns True if the date is part of the recurrence pattern
   */
  static isDateInRecurrencePattern(
    date: Date | string,
    rruleStr: string,
    timezone: string
  ): boolean {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Parse the date
      const dt = typeof date === 'string' ?
        TimeZoneService.parseWithZone(date, validTimeZone) :
        DateTime.fromJSDate(date, { zone: validTimeZone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid date: ${dt.invalidReason}`);
      }
      
      // Parse the recurrence rule
      const rule = this.parseRRule(rruleStr);
      
      // Check if the date is part of the recurrence pattern
      return rule.options.freq === RRule.WEEKLY ? 
        rule.options.byweekday.includes(dt.weekday % 7) : // For weekly recurrence, check the day of week
        rule.before(dt.toJSDate(), true) !== null; // For other recurrences, check if the date is in the pattern
    } catch (error) {
      console.error('[RecurrenceService] Error checking if date is in recurrence pattern:', error);
      return false;
    }
  }
  
  /**
   * Get the next occurrence of a recurring event
   * @param rruleStr The RRule string
   * @param after The date to start looking from
   * @param timezone The timezone to use
   * @returns The next occurrence date
   */
  static getNextOccurrence(
    rruleStr: string,
    after: Date | string,
    timezone: string
  ): Date | null {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      // Parse the date
      const dt = typeof after === 'string' ?
        TimeZoneService.parseWithZone(after, validTimeZone) :
        DateTime.fromJSDate(after, { zone: validTimeZone });
      
      if (!dt.isValid) {
        throw new Error(`Invalid date: ${dt.invalidReason}`);
      }
      
      // Parse the recurrence rule
      const rule = this.parseRRule(rruleStr);
      
      // Get the next occurrence
      return rule.after(dt.toJSDate(), true);
    } catch (error) {
      console.error('[RecurrenceService] Error getting next occurrence:', error);
      return null;
    }
  }
  
  /**
   * Store a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param ttl The time-to-live in milliseconds
   */
  private static storeInCache<T>(key: string, value: T, ttl: number): void {
    try {
      const cache = this.getRecurrenceCache();
      cache[key] = {
        value,
        expires: Date.now() + ttl
      };
    } catch (error) {
      console.error('[RecurrenceService] Error storing in cache:', error);
    }
  }
  
  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value, or null if not found or expired
   */
  private static getFromCache<T>(key: string): T | null {
    try {
      const cache = this.getRecurrenceCache();
      const entry = cache[key];
      
      if (!entry) {
        return null;
      }
      
      if (entry.expires < Date.now()) {
        delete cache[key];
        return null;
      }
      
      return entry.value as T;
    } catch (error) {
      console.error('[RecurrenceService] Error getting from cache:', error);
      return null;
    }
  }
  
  /**
   * Get the recurrence cache
   * @returns The recurrence cache object
   */
  private static getRecurrenceCache(): Record<string, { value: any, expires: number }> {
    if (!(window as any).__recurrenceCache) {
      (window as any).__recurrenceCache = {};
    }
    
    return (window as any).__recurrenceCache;
  }
  
  /**
   * Invalidate the cache for an event
   * @param eventId The ID of the event
   */
  static invalidateCache(eventId: string): void {
    try {
      const cache = this.getRecurrenceCache();
      
      // Clear any cache entries related to this event
      Object.keys(cache).forEach(key => {
        if (key.includes(eventId)) {
          delete cache[key];
        }
      });
      
      // Also invalidate the Supabase cache
      cachedSupabase.invalidateTable('recurrence_rules');
    } catch (error) {
      console.error('[RecurrenceService] Error invalidating cache:', error);
    }
  }
  
  /**
   * Invalidate the cache for a recurrence rule
   * @param recurrenceId The ID of the recurrence rule
   */
  static invalidateCacheByRecurrenceId(recurrenceId: string): void {
    try {
      const cache = this.getRecurrenceCache();
      
      // Clear any cache entries related to this recurrence rule
      Object.keys(cache).forEach(key => {
        if (key.includes(recurrenceId)) {
          delete cache[key];
        }
      });
      
      // Also invalidate the Supabase cache
      cachedSupabase.invalidateTable('recurrence_rules');
    } catch (error) {
      console.error('[RecurrenceService] Error invalidating cache by recurrence ID:', error);
    }
  }
}