
/**
 * TimeOffService - Responsible for managing clinician time off periods
 */

import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './TimeZoneService';
import { CalendarError, CalendarErrorHandler } from './CalendarErrorHandler';
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

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
    startTime: Date | string,
    endTime: Date | string,
    timeZone: string,
    reason?: string,
    allDay: boolean = false
  ): Promise<TimeOff> {
    try {
      // Validate the time zone
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      
      // Format start and end times to UTC for storage
      const startDt = typeof startTime === 'string'
        ? DateTime.fromISO(startTime, { zone: validTimeZone })
        : DateTime.fromJSDate(startTime as Date).setZone(validTimeZone);
      
      const endDt = typeof endTime === 'string'
        ? DateTime.fromISO(endTime, { zone: validTimeZone })
        : DateTime.fromJSDate(endTime as Date).setZone(validTimeZone);
      
      // Validate that start time is before end time
      if (startDt >= endDt) {
        throw new CalendarError('Start time must be before end time', 'VALIDATION_ERROR');
      }
      
      // Prepare data for insertion
      const timeOffData = {
        clinician_id: clinicianId,
        start_time: startDt.toUTC().toISO(),
        end_time: endDt.toUTC().toISO(),
        reason: reason,
        all_day: allDay,
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
  static async getTimeOffPeriods(
    clinicianId: string, 
    userTimeZone: string,
    startDate?: Date | string, 
    endDate?: Date | string
  ): Promise<TimeOff[]> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
      
      let query = supabase
        .from('time_off')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      // Add date range filters if provided
      if (startDate) {
        const startDt = typeof startDate === 'string' 
          ? DateTime.fromISO(startDate, { zone: validTimeZone })
          : DateTime.fromJSDate(startDate).setZone(validTimeZone);
          
        query = query.gte('start_time', startDt.toUTC().toISO());
      }
      
      if (endDate) {
        const endDt = typeof endDate === 'string'
          ? DateTime.fromISO(endDate, { zone: validTimeZone })
          : DateTime.fromJSDate(endDate).setZone(validTimeZone);
          
        query = query.lte('end_time', endDt.toUTC().toISO());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[TimeOffService] Error getting time off periods:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      // Map database records to TimeOff objects
      return data.map(record => {
        const timeZone = record.time_zone || validTimeZone;
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
   * Get a single time off period by ID
   */
  static async getTimeOffById(id: string, userTimeZone: string): Promise<TimeOff | null> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
      
      const { data, error } = await supabase
        .from('time_off')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {  // record not found
          return null;
        }
        console.error('[TimeOffService] Error getting time off by ID:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }
      
      if (!data) {
        return null;
      }
      
      // Convert timestamps to user timezone
      const timeZone = data.time_zone || validTimeZone;
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
  static async updateTimeOff(timeOffId: string, updates: Partial<TimeOff>): Promise<TimeOff> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(updates.timeZone);
      
      // Prepare data for update
      const updateData: any = {};
      
      if (updates.clinicianId) {
        updateData.clinician_id = updates.clinicianId;
      }
      
      if (updates.startTime) {
        const startDt = typeof updates.startTime === 'string'
          ? DateTime.fromISO(updates.startTime, { zone: validTimeZone })
          : DateTime.fromJSDate(updates.startTime as Date).setZone(validTimeZone);
        
        updateData.start_time = startDt.toUTC().toISO();
      }
      
      if (updates.endTime) {
        const endDt = typeof updates.endTime === 'string'
          ? DateTime.fromISO(updates.endTime, { zone: validTimeZone })
          : DateTime.fromJSDate(updates.endTime as Date).setZone(validTimeZone);
        
        updateData.end_time = endDt.toUTC().toISO();
      }
      
      if (updates.reason !== undefined) {
        updateData.reason = updates.reason;
      }
      
      if (updates.allDay !== undefined) {
        updateData.all_day = updates.allDay;
      }
      
      if (updates.timeZone) {
        updateData.time_zone = validTimeZone;
      }
      
      const { data, error } = await supabase
        .from('time_off')
        .update(updateData)
        .eq('id', timeOffId)
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
      const timeZone = data.time_zone || validTimeZone;
      const localStartDt = DateTime.fromISO(data.start_time).setZone(timeZone);
      const localEndDt = DateTime.fromISO(data.end_time).setZone(timeZone);
      
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

  /**
   * Convert a TimeOff object to CalendarEvent format
   */
  static toCalendarEvent(timeOff: TimeOff, userTimeZone: string): CalendarEvent {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    // Convert times to the user's timezone if needed
    const startDt = typeof timeOff.startTime === 'string'
      ? DateTime.fromISO(timeOff.startTime)
      : DateTime.fromJSDate(timeOff.startTime as Date);
    
    const endDt = typeof timeOff.endTime === 'string'
      ? DateTime.fromISO(timeOff.endTime)
      : DateTime.fromJSDate(timeOff.endTime as Date);
    
    // Create a calendar event from the time off period
    return {
      id: timeOff.id,
      title: timeOff.reason || 'Time Off',
      start: startDt.toJSDate(),
      end: endDt.toJSDate(),
      allDay: timeOff.allDay,
      extendedProps: {
        eventType: 'time_off',
        clinicianId: timeOff.clinicianId,
        description: timeOff.reason,
        timezone: validTimeZone,
        sourceTimeZone: timeOff.timeZone
      }
    };
  }

  /**
   * Get all time off periods and convert them to CalendarEvent format
   */
  static async getTimeOff(
    clinicianId: string,
    userTimeZone: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<CalendarEvent[]> {
    const timeOffPeriods = await this.getTimeOffPeriods(clinicianId, userTimeZone, startDate, endDate);
    return timeOffPeriods.map(timeOff => this.toCalendarEvent(timeOff, userTimeZone));
  }
}
