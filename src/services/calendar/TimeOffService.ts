/**
 * TimeOffService - Responsible for managing clinician time off periods
 */

import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './TimeZoneService';
import { CalendarError, CalendarErrorHandler } from './CalendarErrorHandler';
import { DateTime } from 'luxon';

// Define TimeOff interface
export interface TimeOff {
  id?: string;
  clinicianId: string;
  startTime: Date | string;
  endTime: Date | string;
  reason?: string;
  allDay: boolean;
  timeZone: string;
}

export class TimeOffService {
  /**
   * Create a new time off period for a clinician
   */
  static async createTimeOff(
    clinicianId: string,
    startTime: string | Date,
    endTime: string | Date,
    timeZone: string,
    reason?: string,
    allDay: boolean = false
  ): Promise<any> {
    try {
      // Create TimeOff object from parameters
      const timeOff: TimeOff = {
        clinicianId,
        startTime,
        endTime,
        timeZone,
        reason,
        allDay
      };
      
      // Validate the time zone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeOff.timeZone);
      
      // Format start and end times to UTC for storage
      const startDt = typeof timeOff.startTime === 'string'
        ? DateTime.fromISO(timeOff.startTime, { zone: validTimeZone })
        : DateTime.fromJSDate(timeOff.startTime as Date).setZone(validTimeZone);
      
      const endDt = typeof timeOff.endTime === 'string'
        ? DateTime.fromISO(timeOff.endTime, { zone: validTimeZone })
        : DateTime.fromJSDate(timeOff.endTime as Date).setZone(validTimeZone);
      
      // Validate that start time is before end time
      if (startDt >= endDt) {
        throw new CalendarError('Start time must be before end time', 'VALIDATION_ERROR');
      }
      
      // Prepare data for insertion
      const timeOffData = {
        clinician_id: timeOff.clinicianId,
        start_time: startDt.toUTC().toISO(),
        end_time: endDt.toUTC().toISO(),
        reason: timeOff.reason,
        all_day: timeOff.allDay,
        time_zone: validTimeZone
      };
      
      console.log('[TimeOffService] Creating time off:', timeOffData);
      
      // Insert into the time_off table
      const { data, error } = await supabase
        .from('time_off')
        .insert([timeOffData])
        .select()
        .single();
      
      if (error) {
        console.error('[TimeOffService] Error creating time off:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data) {
        throw new CalendarError('Failed to create time off period', 'CALENDAR_DB_ERROR');
      }
      
      // Convert back to local time for return
      const localStartDt = DateTime.fromISO(data.start_time).setZone(validTimeZone);
      const localEndDt = DateTime.fromISO(data.end_time).setZone(validTimeZone);
      
      // Return the time off period with converted times
      return {
        id: data.id,
        clinician_id: data.clinician_id,
        start_time: localStartDt.toJSDate(),
        end_time: localEndDt.toJSDate(),
        reason: data.reason,
        all_day: data.all_day,
        time_zone: data.time_zone
      };
    } catch (error) {
      console.error('[TimeOffService] Error in createTimeOff:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get time off periods for a clinician
   */
  static async getTimeOffPeriods(clinicianId: string, startDate?: Date, endDate?: Date): Promise<TimeOff[]> {
    try {
      let query = supabase
        .from('time_off')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      // Add date range filters if provided
      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('end_time', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[TimeOffService] Error getting time off periods:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      // Map database records to TimeOff objects
      return data.map(record => {
        const timeZone = record.time_zone || 'America/Chicago';
        const localStartDt = DateTime.fromISO(record.start_time).setZone(timeZone);
        const localEndDt = DateTime.fromISO(record.end_time).setZone(timeZone);
        
        return {
          id: record.id,
          clinicianId: record.clinician_id,
          startTime: localStartDt.toJSDate(),
          endTime: localEndDt.toJSDate(),
          reason: record.reason,
          allDay: record.all_day,
          timeZone: timeZone
        };
      });
    } catch (error) {
      console.error('[TimeOffService] Error in getTimeOffPeriods:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Get a time off period by ID
   */
  static async getTimeOffById(timeOffId: string): Promise<TimeOff | null> {
    try {
      const { data, error } = await supabase
        .from('time_off')
        .select('*')
        .eq('id', timeOffId)
        .single();
      
      if (error) {
        // If not found, return null
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[TimeOffService] Error getting time off by ID:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data) {
        return null;
      }
      
      const timeZone = data.time_zone || 'America/Chicago';
      const localStartDt = DateTime.fromISO(data.start_time).setZone(timeZone);
      const localEndDt = DateTime.fromISO(data.end_time).setZone(timeZone);
      
      return {
        id: data.id,
        clinicianId: data.clinician_id,
        startTime: localStartDt.toJSDate(),
        endTime: localEndDt.toJSDate(),
        reason: data.reason,
        allDay: data.all_day,
        timeZone: timeZone
      };
    } catch (error) {
      console.error('[TimeOffService] Error in getTimeOffById:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Delete a time off period
   */
  static async deleteTimeOff(timeOffId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('id', timeOffId);
      
      if (error) {
        console.error('[TimeOffService] Error deleting time off:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      return true;
    } catch (error) {
      console.error('[TimeOffService] Error in deleteTimeOff:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Update a time off period
   */
  static async updateTimeOff(
    timeOffId: string,
    updates: Partial<{
      start_time: string;
      end_time: string;
      reason: string;
      all_day: boolean;
      time_zone: string;
      clinician_id: string;
    }>
  ): Promise<any> {
    try {
      // Get the existing time off record
      const existingTimeOff = await this.getTimeOffById(timeOffId);
      
      if (!existingTimeOff) {
        throw new CalendarError('Time off period not found', 'VALIDATION_ERROR');
      }
      
      // If both start and end times are provided, validate the time range
      if (updates.start_time && updates.end_time) {
        const startDt = DateTime.fromISO(updates.start_time);
        const endDt = DateTime.fromISO(updates.end_time);
        
        if (startDt >= endDt) {
          throw new CalendarError('Start time must be before end time', 'VALIDATION_ERROR');
        }
      }
      
      // Prepare data for update
      const timeOffData = {
        clinician_id: updates.clinician_id || existingTimeOff.clinicianId,
        start_time: updates.start_time || (existingTimeOff.startTime instanceof Date ? 
          existingTimeOff.startTime.toISOString() : existingTimeOff.startTime),
        end_time: updates.end_time || (existingTimeOff.endTime instanceof Date ? 
          existingTimeOff.endTime.toISOString() : existingTimeOff.endTime),
        reason: updates.reason !== undefined ? updates.reason : existingTimeOff.reason,
        all_day: updates.all_day !== undefined ? updates.all_day : existingTimeOff.allDay,
        time_zone: updates.time_zone || existingTimeOff.timeZone
      };
      
      const { data, error } = await supabase
        .from('time_off')
        .update(timeOffData)
        .eq('id', timeOffId)
        .select()
        .single();
      
      if (error) {
        console.error('[TimeOffService] Error updating time off:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data) {
        throw new CalendarError('Failed to update time off period', 'CALENDAR_DB_ERROR');
      }
      
      // Convert back to local time for return
      const timeZone = data.time_zone || 'America/Chicago';
      const localStartDt = DateTime.fromISO(data.start_time).setZone(timeZone);
      const localEndDt = DateTime.fromISO(data.end_time).setZone(timeZone);
      
      return {
        id: data.id,
        clinician_id: data.clinician_id,
        start_time: localStartDt.toJSDate(),
        end_time: localEndDt.toJSDate(),
        reason: data.reason,
        all_day: data.all_day,
        time_zone: data.time_zone
      };
    } catch (error) {
      console.error('[TimeOffService] Error in updateTimeOff:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Get time off periods for a clinician (alias for backward compatibility)
   */
  static async getTimeOff(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<any[]> {
    // Convert string dates to Date objects if needed
    const startDateObj = startDate && typeof startDate === 'string' ? new Date(startDate) : startDate as Date;
    const endDateObj = endDate && typeof endDate === 'string' ? new Date(endDate) : endDate as Date;
    
    return this.getTimeOffPeriods(clinicianId, startDateObj, endDateObj);
  }
  
  /**
   * Convert a TimeOff object to a CalendarEvent
   */
  static toCalendarEvent(timeOff: any, timeZone: string): any {
    return {
      id: timeOff.id,
      title: timeOff.reason || 'Time Off',
      start: timeOff.start_time || timeOff.startTime,
      end: timeOff.end_time || timeOff.endTime,
      allDay: timeOff.all_day || timeOff.allDay,
      extendedProps: {
        type: 'time_off',
        clinicianId: timeOff.clinician_id || timeOff.clinicianId,
        timeZone: timeOff.time_zone || timeOff.timeZone || timeZone
      }
    };
  }
}
