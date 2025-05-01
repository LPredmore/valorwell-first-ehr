import { DateTime } from 'luxon';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './TimeZoneService';
import { CalendarError } from './CalendarErrorHandler';

/**
 * RecurrenceService
 * 
 * Handles all operations related to recurring events in the calendar system.
 * This includes creating, parsing, and expanding recurrence rules, as well as
 * managing exceptions to recurring events.
 */
export class RecurrenceService {
  /**
   * Creates a new recurrence pattern in the database
   * 
   * @param rrule - The recurrence rule string in iCalendar format
   * @returns The ID of the created recurrence pattern
   */
  static async createRecurrencePattern(rrule: string): Promise<string> {
    try {
      // Validate the RRule string
      this.validateRRule(rrule);

      const { data, error } = await supabase
        .from('recurrence_patterns')
        .insert({ rrule })
        .select('id')
        .single();

      if (error) {
        throw new CalendarError(
          'Failed to create recurrence pattern',
          'CALENDAR_DB_ERROR',
          { rrule, error }
        );
      }

      return data.id;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create recurrence pattern',
        'CALENDAR_UNKNOWN_ERROR',
        { rrule, originalError: error }
      );
    }
  }

  /**
   * Retrieves a recurrence pattern from the database
   * 
   * @param id - The ID of the recurrence pattern
   * @returns The recurrence rule string
   */
  static async getRecurrencePattern(id: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('recurrence_patterns')
        .select('rrule')
        .eq('id', id)
        .single();

      if (error) {
        throw new CalendarError(
          'Failed to retrieve recurrence pattern',
          'CALENDAR_DB_ERROR',
          { id, error }
        );
      }

      return data.rrule;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to retrieve recurrence pattern',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Updates a recurrence pattern in the database
   * 
   * @param id - The ID of the recurrence pattern
   * @param rrule - The new recurrence rule string
   * @returns True if the update was successful
   */
  static async updateRecurrencePattern(id: string, rrule: string): Promise<boolean> {
    try {
      // Validate the RRule string
      this.validateRRule(rrule);

      const { error } = await supabase
        .from('recurrence_patterns')
        .update({ rrule, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw new CalendarError(
          'Failed to update recurrence pattern',
          'CALENDAR_DB_ERROR',
          { id, rrule, error }
        );
      }

      return true;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update recurrence pattern',
        'CALENDAR_UNKNOWN_ERROR',
        { id, rrule, originalError: error }
      );
    }
  }

  /**
   * Deletes a recurrence pattern from the database
   * 
   * @param id - The ID of the recurrence pattern
   * @returns True if the deletion was successful
   */
  static async deleteRecurrencePattern(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recurrence_patterns')
        .delete()
        .eq('id', id);

      if (error) {
        throw new CalendarError(
          'Failed to delete recurrence pattern',
          'CALENDAR_DB_ERROR',
          { id, error }
        );
      }

      return true;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to delete recurrence pattern',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Creates a recurrence exception for a recurring event
   * 
   * @param availabilityBlockId - The ID of the availability block
   * @param exceptionDate - The date of the exception
   * @param isCancelled - Whether the occurrence is cancelled
   * @param replacementBlockId - The ID of the replacement block (optional)
   * @returns The ID of the created exception
   */
  static async createException(
    availabilityBlockId: string,
    exceptionDate: Date | string,
    isCancelled: boolean = true,
    replacementBlockId?: string
  ): Promise<string> {
    try {
      const exceptionDateStr = typeof exceptionDate === 'string' 
        ? exceptionDate 
        : exceptionDate.toISOString();

      const { data, error } = await supabase
        .from('availability_exceptions')
        .insert({
          availability_block_id: availabilityBlockId,
          exception_date: exceptionDateStr,
          is_cancelled: isCancelled,
          replacement_block_id: replacementBlockId
        })
        .select('id')
        .single();

      if (error) {
        throw new CalendarError(
          'Failed to create recurrence exception',
          'CALENDAR_DB_ERROR',
          { availabilityBlockId, exceptionDate, isCancelled, replacementBlockId, error }
        );
      }

      return data.id;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create recurrence exception',
        'CALENDAR_UNKNOWN_ERROR',
        { availabilityBlockId, exceptionDate, isCancelled, replacementBlockId, originalError: error }
      );
    }
  }

  /**
   * Gets all exceptions for a recurring event
   * 
   * @param availabilityBlockId - The ID of the availability block
   * @returns An array of exceptions
   */
  static async getExceptions(availabilityBlockId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('availability_block_id', availabilityBlockId);

      if (error) {
        throw new CalendarError(
          'Failed to retrieve recurrence exceptions',
          'CALENDAR_DB_ERROR',
          { availabilityBlockId, error }
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to retrieve recurrence exceptions',
        'CALENDAR_UNKNOWN_ERROR',
        { availabilityBlockId, originalError: error }
      );
    }
  }

  /**
   * Expands a recurring event into individual occurrences
   * 
   * @param rrule - The recurrence rule string
   * @param startDate - The start date of the first occurrence
   * @param endDate - The end date of the first occurrence
   * @param timeZone - The timezone of the event
   * @param rangeStart - The start of the range to expand (optional)
   * @param rangeEnd - The end of the range to expand (optional)
   * @param limit - The maximum number of occurrences to generate (optional)
   * @returns An array of occurrence dates
   */
  static expandRecurrence(
    rrule: string,
    startDate: Date | string,
    endDate: Date | string,
    timeZone: string,
    rangeStart?: Date | string,
    rangeEnd?: Date | string,
    limit: number = 100
  ): { start: Date; end: Date }[] {
    try {
      // Validate the RRule string
      this.validateRRule(rrule);
      
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to DateTime objects in the specified timezone
      const start = typeof startDate === 'string'
        ? DateTime.fromISO(startDate, { zone: validTimeZone })
        : DateTime.fromJSDate(startDate, { zone: validTimeZone });
      
      const end = typeof endDate === 'string'
        ? DateTime.fromISO(endDate, { zone: validTimeZone })
        : DateTime.fromJSDate(endDate, { zone: validTimeZone });
      
      // Calculate the duration of the event
      const duration = end.diff(start);
      
      // Parse the RRule
      const rule = rrulestr(rrule);
      
      // Set up options for the RRule.between method
      const options: any = {
        inc: true,  // Include the start date
        limit: limit
      };
      
      // If range start and end are provided, use them
      let startRange: Date | undefined;
      let endRange: Date | undefined;
      
      if (rangeStart) {
        startRange = typeof rangeStart === 'string'
          ? DateTime.fromISO(rangeStart, { zone: validTimeZone }).toJSDate()
          : rangeStart;
        options.after = startRange;
      }
      
      if (rangeEnd) {
        endRange = typeof rangeEnd === 'string'
          ? DateTime.fromISO(rangeEnd, { zone: validTimeZone }).toJSDate()
          : rangeEnd;
        options.before = endRange;
      }
      
      // Get the occurrences
      const occurrences = rule.between(
        startRange || start.toJSDate(),
        endRange || DateTime.fromJSDate(start.toJSDate()).plus({ years: 1 }).toJSDate(),
        options
      );
      
      // Map the occurrences to start and end dates
      return occurrences.map(date => {
        const occurrenceStart = DateTime.fromJSDate(date, { zone: validTimeZone });
        const occurrenceEnd = occurrenceStart.plus(duration);
        return {
          start: occurrenceStart.toJSDate(),
          end: occurrenceEnd.toJSDate()
        };
      });
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to expand recurrence',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          rrule, 
          startDate, 
          endDate, 
          timeZone, 
          rangeStart, 
          rangeEnd, 
          limit, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Checks if a date is an occurrence of a recurring event
   * 
   * @param rrule - The recurrence rule string
   * @param startDate - The start date of the first occurrence
   * @param checkDate - The date to check
   * @param timeZone - The timezone of the event
   * @returns True if the date is an occurrence
   */
  static isOccurrence(
    rrule: string,
    startDate: Date | string,
    checkDate: Date | string,
    timeZone: string
  ): boolean {
    try {
      // Validate the RRule string
      this.validateRRule(rrule);
      
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to DateTime objects in the specified timezone
      const start = typeof startDate === 'string'
        ? DateTime.fromISO(startDate, { zone: validTimeZone })
        : DateTime.fromJSDate(startDate, { zone: validTimeZone });
      
      const check = typeof checkDate === 'string'
        ? DateTime.fromISO(checkDate, { zone: validTimeZone })
        : DateTime.fromJSDate(checkDate, { zone: validTimeZone });
      
      // Parse the RRule
      const rule = rrulestr(rrule);
      
      // Check if the date is an occurrence
      const occurrences = rule.between(
        check.minus({ days: 1 }).toJSDate(),
        check.plus({ days: 1 }).toJSDate(),
        true
      );
      
      // Check if any of the occurrences match the check date
      return occurrences.some(date => {
        const occurrenceDate = DateTime.fromJSDate(date, { zone: validTimeZone });
        return occurrenceDate.hasSame(check, 'day') && 
               occurrenceDate.hasSame(check, 'hour') && 
               occurrenceDate.hasSame(check, 'minute');
      });
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to check if date is an occurrence',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          rrule, 
          startDate, 
          checkDate, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets the next occurrence of a recurring event after a specified date
   * 
   * @param rrule - The recurrence rule string
   * @param startDate - The start date of the first occurrence
   * @param afterDate - The date to find the next occurrence after
   * @param timeZone - The timezone of the event
   * @returns The next occurrence date or null if there are no more occurrences
   */
  static getNextOccurrence(
    rrule: string,
    startDate: Date | string,
    afterDate: Date | string,
    timeZone: string
  ): Date | null {
    try {
      // Validate the RRule string
      this.validateRRule(rrule);
      
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to DateTime objects in the specified timezone
      const start = typeof startDate === 'string'
        ? DateTime.fromISO(startDate, { zone: validTimeZone })
        : DateTime.fromJSDate(startDate, { zone: validTimeZone });
      
      const after = typeof afterDate === 'string'
        ? DateTime.fromISO(afterDate, { zone: validTimeZone })
        : DateTime.fromJSDate(afterDate, { zone: validTimeZone });
      
      // Parse the RRule
      const rule = rrulestr(rrule);
      
      // Get the next occurrence
      const occurrences = rule.between(
        after.toJSDate(),
        after.plus({ years: 1 }).toJSDate(),
        false
      );
      
      return occurrences.length > 0 ? occurrences[0] : null;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get next occurrence',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          rrule, 
          startDate, 
          afterDate, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Creates an RRule string from parameters
   * 
   * @param frequency - The frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
   * @param interval - The interval (e.g., every 2 weeks)
   * @param startDate - The start date
   * @param endDate - The end date (optional)
   * @param count - The number of occurrences (optional)
   * @param byDay - The days of the week (e.g., ['MO', 'WE', 'FR'])
   * @param byMonthDay - The days of the month (e.g., [1, 15])
   * @param byMonth - The months (e.g., [1, 6])
   * @param timeZone - The timezone
   * @returns The RRule string
   */
  static createRRule(
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    interval: number,
    startDate: Date | string,
    endDate?: Date | string,
    count?: number,
    byDay?: string[],
    byMonthDay?: number[],
    byMonth?: number[],
    timeZone?: string
  ): string {
    try {
      const validTimeZone = timeZone ? TimeZoneService.validateTimeZone(timeZone) : undefined;
      
      // Convert start date to DateTime
      const start = typeof startDate === 'string'
        ? DateTime.fromISO(startDate, { zone: validTimeZone })
        : DateTime.fromJSDate(startDate, { zone: validTimeZone });
      
      // Set up RRule options
      const options: any = {
        freq: RRule[frequency],
        interval: interval,
        dtstart: start.toJSDate()
      };
      
      // Add end date or count if provided
      if (endDate) {
        const end = typeof endDate === 'string'
          ? DateTime.fromISO(endDate, { zone: validTimeZone })
          : DateTime.fromJSDate(endDate, { zone: validTimeZone });
        
        options.until = end.toJSDate();
      } else if (count) {
        options.count = count;
      }
      
      // Add byDay, byMonthDay, and byMonth if provided
      if (byDay && byDay.length > 0) {
        options.byweekday = byDay.map(day => RRule[day]);
      }
      
      if (byMonthDay && byMonthDay.length > 0) {
        options.bymonthday = byMonthDay;
      }
      
      if (byMonth && byMonth.length > 0) {
        options.bymonth = byMonth;
      }
      
      // Create the RRule
      const rule = new RRule(options);
      
      return rule.toString();
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create RRule',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          frequency, 
          interval, 
          startDate, 
          endDate, 
          count, 
          byDay, 
          byMonthDay, 
          byMonth, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Validates an RRule string
   * 
   * @param rrule - The RRule string to validate
   * @returns True if the RRule is valid
   * @throws CalendarError if the RRule is invalid
   */
  private static validateRRule(rrule: string): boolean {
    try {
      rrulestr(rrule);
      return true;
    } catch (error) {
      throw new CalendarError(
        'Invalid recurrence rule',
        'CALENDAR_VALIDATION_ERROR',
        { rrule, originalError: error }
      );
    }
  }
}