
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
  static async createTimeOff(timeOff: TimeOff): Promise<TimeOff> {
    try {
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
        throw new CalendarError('Failed to create time off period', 'DATABASE_ERROR');
      }
      
      // Convert back to local time for return
      const localStartDt = DateTime.fromISO(data.start_time).setZone(validTimeZone);
      const localEndDt = DateTime.fromISO(data.end_time).setZone(validTimeZone);
      
      // Return the time off period with converted times
      return {
        id: data.id,
        clinicianId: data.clinician_id,
        startTime: localStartDt.toJSDate(),
        endTime: localEndDt.toJSDate(),
        reason: data.reason,
        allDay: data.all_day,
        timeZone: data.time_zone
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
  static async updateTimeOff(timeOff: TimeOff): Promise<TimeOff> {
    try {
      if (!timeOff.id) {
        throw new CalendarError('Time off ID is required for update', 'VALIDATION_ERROR');
      }
      
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
      
      // Prepare data for update
      const timeOffData = {
        clinician_id: timeOff.clinicianId,
        start_time: startDt.toUTC().toISO(),
        end_time: endDt.toUTC().toISO(),
        reason: timeOff.reason,
        all_day: timeOff.allDay,
        time_zone: validTimeZone
      };
      
      const { data, error } = await supabase
        .from('time_off')
        .update(timeOffData)
        .eq('id', timeOff.id)
        .select()
        .single();
      
      if (error) {
        console.error('[TimeOffService] Error updating time off:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data) {
        throw new CalendarError('Failed to update time off period', 'DATABASE_ERROR');
      }
      
      // Convert back to local time for return
      const localStartDt = DateTime.fromISO(data.start_time).setZone(validTimeZone);
      const localEndDt = DateTime.fromISO(data.end_time).setZone(validTimeZone);
      
      return {
        id: data.id,
        clinicianId: data.clinician_id,
        startTime: localStartDt.toJSDate(),
        endTime: localEndDt.toJSDate(),
        reason: data.reason,
        allDay: data.all_day,
        timeZone: data.time_zone
      };
    } catch (error) {
      console.error('[TimeOffService] Error in updateTimeOff:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
}
