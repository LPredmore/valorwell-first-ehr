import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './TimeZoneService';
import { CalendarError } from './CalendarErrorHandler';
import { CalendarEvent } from '@/types/calendar';

/**
 * Interface for time off data
 */
interface TimeOff {
  id?: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  all_day: boolean;
  time_zone: string;
}

/**
 * TimeOffService
 * 
 * Handles all operations related to clinician time off in the calendar system.
 * This includes creating, retrieving, updating, and deleting time off periods.
 */
export class TimeOffService {
  /**
   * Creates a new time off period
   * 
   * @param clinicianId - The ID of the clinician
   * @param startTime - The start time of the time off period
   * @param endTime - The end time of the time off period
   * @param timeZone - The timezone of the time off period
   * @param reason - The reason for the time off (optional)
   * @param allDay - Whether the time off is for the entire day (optional)
   * @returns The created time off period
   */
  static async createTimeOff(
    clinicianId: string,
    startTime: Date | string,
    endTime: Date | string,
    timeZone: string,
    reason?: string,
    allDay: boolean = false
  ): Promise<TimeOff> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to ISO strings
      const startTimeStr = typeof startTime === 'string' 
        ? startTime 
        : startTime.toISOString();
      
      const endTimeStr = typeof endTime === 'string' 
        ? endTime 
        : endTime.toISOString();
      
      // Validate time range
      if (new Date(startTimeStr) >= new Date(endTimeStr)) {
        throw new CalendarError(
          'Start time must be before end time',
          'CALENDAR_VALIDATION_ERROR',
          { startTime: startTimeStr, endTime: endTimeStr }
        );
      }
      
      // Create time off period
      const timeOff: TimeOff = {
        clinician_id: clinicianId,
        start_time: startTimeStr,
        end_time: endTimeStr,
        reason,
        all_day: allDay,
        time_zone: validTimeZone
      };
      
      // Insert time off period
      const { data, error } = await supabase
        .from('time_off')
        .insert(timeOff)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to create time off period',
          'CALENDAR_DB_ERROR',
          { timeOff, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create time off period',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          startTime, 
          endTime, 
          timeZone, 
          reason, 
          allDay, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets time off periods for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the time off periods in
   * @param startDate - The start date of the range to get time off periods for (optional)
   * @param endDate - The end date of the range to get time off periods for (optional)
   * @returns An array of time off periods
   */
  static async getTimeOff(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<TimeOff[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Build query
      let query = supabase
        .from('time_off')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      // Add date range filter if provided
      if (startDate && endDate) {
        const startDateStr = typeof startDate === 'string' 
          ? startDate 
          : startDate.toISOString();
        
        const endDateStr = typeof endDate === 'string' 
          ? endDate 
          : endDate.toISOString();
        
        query = query
          .gte('end_time', startDateStr)
          .lte('start_time', endDateStr);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw new CalendarError(
          'Failed to get time off periods',
          'CALENDAR_DB_ERROR',
          { clinicianId, timeZone, startDate, endDate, error }
        );
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get time off periods',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets a single time off period by ID
   * 
   * @param id - The ID of the time off period
   * @returns The time off period or null if not found
   */
  static async getTimeOffById(id: string): Promise<TimeOff | null> {
    try {
      const { data, error } = await supabase
        .from('time_off')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        
        throw new CalendarError(
          'Failed to get time off period',
          'CALENDAR_DB_ERROR',
          { id, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get time off period',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Updates a time off period
   * 
   * @param id - The ID of the time off period to update
   * @param updates - The updates to apply
   * @returns The updated time off period
   */
  static async updateTimeOff(
    id: string,
    updates: Partial<TimeOff>
  ): Promise<TimeOff> {
    try {
      // Get the current time off period
      const currentTimeOff = await this.getTimeOffById(id);
      
      if (!currentTimeOff) {
        throw new CalendarError(
          'Time off period not found',
          'CALENDAR_VALIDATION_ERROR',
          { id }
        );
      }
      
      // Validate time zone if provided
      if (updates.time_zone) {
        updates.time_zone = TimeZoneService.validateTimeZone(updates.time_zone);
      }
      
      // Validate time range if both start and end times are provided
      if (updates.start_time && updates.end_time) {
        if (new Date(updates.start_time) >= new Date(updates.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: updates.start_time, endTime: updates.end_time }
          );
        }
      } else if (updates.start_time && !updates.end_time) {
        // If only start time is provided, validate against current end time
        if (new Date(updates.start_time) >= new Date(currentTimeOff.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: updates.start_time, endTime: currentTimeOff.end_time }
          );
        }
      } else if (!updates.start_time && updates.end_time) {
        // If only end time is provided, validate against current start time
        if (new Date(currentTimeOff.start_time) >= new Date(updates.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: currentTimeOff.start_time, endTime: updates.end_time }
          );
        }
      }
      
      // Update the time off period
      const { data, error } = await supabase
        .from('time_off')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to update time off period',
          'CALENDAR_DB_ERROR',
          { id, updates, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update time off period',
        'CALENDAR_UNKNOWN_ERROR',
        { id, updates, originalError: error }
      );
    }
  }

  /**
   * Deletes a time off period
   * 
   * @param id - The ID of the time off period to delete
   * @returns True if the deletion was successful
   */
  static async deleteTimeOff(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new CalendarError(
          'Failed to delete time off period',
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
        'Failed to delete time off period',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Checks if a clinician has time off during a specific period
   * 
   * @param clinicianId - The ID of the clinician
   * @param startTime - The start time of the period
   * @param endTime - The end time of the period
   * @param timeZone - The timezone of the period
   * @returns True if the clinician has time off during the period
   */
  static async hasTimeOffDuring(
    clinicianId: string,
    startTime: Date | string,
    endTime: Date | string,
    timeZone: string
  ): Promise<boolean> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to ISO strings
      const startTimeStr = typeof startTime === 'string' 
        ? startTime 
        : startTime.toISOString();
      
      const endTimeStr = typeof endTime === 'string' 
        ? endTime 
        : endTime.toISOString();
      
      // Query for overlapping time off periods
      const { data, error } = await supabase
        .from('time_off')
        .select('id')
        .eq('clinician_id', clinicianId)
        .lte('start_time', endTimeStr)
        .gte('end_time', startTimeStr);
      
      if (error) {
        throw new CalendarError(
          'Failed to check for time off',
          'CALENDAR_DB_ERROR',
          { clinicianId, startTime, endTime, timeZone, error }
        );
      }
      
      return (data || []).length > 0;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to check for time off',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          startTime, 
          endTime, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Converts a time off period to a calendar event
   * 
   * @param timeOff - The time off period to convert
   * @param userTimeZone - The timezone to convert to
   * @returns A calendar event
   */
  static toCalendarEvent(timeOff: TimeOff, userTimeZone: string): CalendarEvent {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(userTimeZone);
      
      // Convert start and end times to the user's timezone
      const start = TimeZoneService.convertTimeZone(
        timeOff.start_time,
        timeOff.time_zone,
        validTimeZone
      );
      
      const end = TimeZoneService.convertTimeZone(
        timeOff.end_time,
        timeOff.time_zone,
        validTimeZone
      );
      
      return {
        id: timeOff.id,
        title: timeOff.reason || 'Time Off',
        start,
        end,
        allDay: timeOff.all_day,
        backgroundColor: '#FF9800', // Orange
        borderColor: '#F57C00',
        textColor: '#FFFFFF',
        extendedProps: {
          clinicianId: timeOff.clinician_id,
          eventType: 'time_off',
          description: timeOff.reason,
          isAvailability: false,
          isRecurring: false,
          timezone: validTimeZone,
          sourceTimeZone: timeOff.time_zone
        }
      };
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert time off period to calendar event',
        'CALENDAR_CONVERSION_ERROR',
        { timeOff, userTimeZone, originalError: error }
      );
    }
  }
}