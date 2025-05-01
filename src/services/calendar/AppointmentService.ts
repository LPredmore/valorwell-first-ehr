import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './TimeZoneService';
import { CalendarError } from './CalendarErrorHandler';
import { AvailabilityService } from './AvailabilityService';
import { CalendarEvent } from '@/types/calendar';

/**
 * Interface for appointment data
 */
interface Appointment {
  id?: string;
  client_id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  type: string;
  status?: string;
  notes?: string;
  recurrence_group_id?: string;
  time_zone: string;
}

/**
 * AppointmentService
 * 
 * Handles all operations related to appointments in the calendar system.
 * This includes creating, retrieving, updating, and deleting appointments,
 * as well as checking availability and handling appointment status changes.
 */
export class AppointmentService {
  /**
   * Creates a new appointment
   * 
   * @param clientId - The ID of the client
   * @param clinicianId - The ID of the clinician
   * @param startTime - The start time of the appointment
   * @param endTime - The end time of the appointment
   * @param type - The type of appointment
   * @param timeZone - The timezone of the appointment
   * @param notes - Additional notes (optional)
   * @param status - The status of the appointment (optional, defaults to 'scheduled')
   * @returns The created appointment
   */
  static async createAppointment(
    clientId: string,
    clinicianId: string,
    startTime: Date | string,
    endTime: Date | string,
    type: string,
    timeZone: string,
    notes?: string,
    status: string = 'scheduled'
  ): Promise<Appointment> {
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
      
      // Check if the time slot is available
      const isAvailable = await AvailabilityService.isTimeSlotAvailable(
        clinicianId,
        startTimeStr,
        endTimeStr,
        validTimeZone
      );
      
      if (!isAvailable) {
        throw new CalendarError(
          'The selected time slot is not available',
          'CALENDAR_VALIDATION_ERROR',
          { clinicianId, startTime: startTimeStr, endTime: endTimeStr }
        );
      }
      
      // Create appointment
      const appointment: Appointment = {
        client_id: clientId,
        clinician_id: clinicianId,
        start_time: startTimeStr,
        end_time: endTimeStr,
        type,
        status,
        notes,
        time_zone: validTimeZone
      };
      
      // Insert appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to create appointment',
          'CALENDAR_DB_ERROR',
          { appointment, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create appointment',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clientId, 
          clinicianId, 
          startTime, 
          endTime, 
          type, 
          timeZone, 
          notes, 
          status, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets appointments for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the appointments in
   * @param startDate - The start date of the range to get appointments for (optional)
   * @param endDate - The end date of the range to get appointments for (optional)
   * @param status - The status of appointments to include (optional)
   * @returns An array of appointments
   */
  static async getAppointments(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string,
    status?: string
  ): Promise<Appointment[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Build query
      let query = supabase
        .from('appointments')
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
      
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw new CalendarError(
          'Failed to get appointments',
          'CALENDAR_DB_ERROR',
          { clinicianId, timeZone, startDate, endDate, status, error }
        );
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get appointments',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          status, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets appointments for a client
   * 
   * @param clientId - The ID of the client
   * @param timeZone - The timezone to return the appointments in
   * @param startDate - The start date of the range to get appointments for (optional)
   * @param endDate - The end date of the range to get appointments for (optional)
   * @param status - The status of appointments to include (optional)
   * @returns An array of appointments
   */
  static async getClientAppointments(
    clientId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string,
    status?: string
  ): Promise<Appointment[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Build query
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId);
      
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
      
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw new CalendarError(
          'Failed to get client appointments',
          'CALENDAR_DB_ERROR',
          { clientId, timeZone, startDate, endDate, status, error }
        );
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get client appointments',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clientId, 
          timeZone, 
          startDate, 
          endDate, 
          status, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets a single appointment by ID
   * 
   * @param id - The ID of the appointment
   * @returns The appointment or null if not found
   */
  static async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        
        throw new CalendarError(
          'Failed to get appointment',
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
        'Failed to get appointment',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Updates an appointment
   * 
   * @param id - The ID of the appointment to update
   * @param updates - The updates to apply
   * @returns The updated appointment
   */
  static async updateAppointment(
    id: string,
    updates: Partial<Appointment>
  ): Promise<Appointment> {
    try {
      // Get the current appointment
      const currentAppointment = await this.getAppointmentById(id);
      
      if (!currentAppointment) {
        throw new CalendarError(
          'Appointment not found',
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
        
        // Check if the new time slot is available
        if (updates.start_time !== currentAppointment.start_time || 
            updates.end_time !== currentAppointment.end_time) {
          
          const isAvailable = await AvailabilityService.isTimeSlotAvailable(
            updates.clinician_id || currentAppointment.clinician_id,
            updates.start_time,
            updates.end_time,
            updates.time_zone || currentAppointment.time_zone
          );
          
          if (!isAvailable) {
            throw new CalendarError(
              'The selected time slot is not available',
              'CALENDAR_VALIDATION_ERROR',
              { 
                clinicianId: updates.clinician_id || currentAppointment.clinician_id, 
                startTime: updates.start_time, 
                endTime: updates.end_time 
              }
            );
          }
        }
      } else if (updates.start_time && !updates.end_time) {
        // If only start time is provided, validate against current end time
        if (new Date(updates.start_time) >= new Date(currentAppointment.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: updates.start_time, endTime: currentAppointment.end_time }
          );
        }
        
        // Check if the new time slot is available
        const isAvailable = await AvailabilityService.isTimeSlotAvailable(
          updates.clinician_id || currentAppointment.clinician_id,
          updates.start_time,
          currentAppointment.end_time,
          updates.time_zone || currentAppointment.time_zone
        );
        
        if (!isAvailable) {
          throw new CalendarError(
            'The selected time slot is not available',
            'CALENDAR_VALIDATION_ERROR',
            { 
              clinicianId: updates.clinician_id || currentAppointment.clinician_id, 
              startTime: updates.start_time, 
              endTime: currentAppointment.end_time 
            }
          );
        }
      } else if (!updates.start_time && updates.end_time) {
        // If only end time is provided, validate against current start time
        if (new Date(currentAppointment.start_time) >= new Date(updates.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: currentAppointment.start_time, endTime: updates.end_time }
          );
        }
        
        // Check if the new time slot is available
        const isAvailable = await AvailabilityService.isTimeSlotAvailable(
          updates.clinician_id || currentAppointment.clinician_id,
          currentAppointment.start_time,
          updates.end_time,
          updates.time_zone || currentAppointment.time_zone
        );
        
        if (!isAvailable) {
          throw new CalendarError(
            'The selected time slot is not available',
            'CALENDAR_VALIDATION_ERROR',
            { 
              clinicianId: updates.clinician_id || currentAppointment.clinician_id, 
              startTime: currentAppointment.start_time, 
              endTime: updates.end_time 
            }
          );
        }
      }
      
      // Update the appointment
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to update appointment',
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
        'Failed to update appointment',
        'CALENDAR_UNKNOWN_ERROR',
        { id, updates, originalError: error }
      );
    }
  }

  /**
   * Updates the status of an appointment
   * 
   * @param id - The ID of the appointment
   * @param status - The new status
   * @returns The updated appointment
   */
  static async updateAppointmentStatus(
    id: string,
    status: string
  ): Promise<Appointment> {
    try {
      // Get the current appointment
      const currentAppointment = await this.getAppointmentById(id);
      
      if (!currentAppointment) {
        throw new CalendarError(
          'Appointment not found',
          'CALENDAR_VALIDATION_ERROR',
          { id }
        );
      }
      
      // Update the status
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to update appointment status',
          'CALENDAR_DB_ERROR',
          { id, status, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update appointment status',
        'CALENDAR_UNKNOWN_ERROR',
        { id, status, originalError: error }
      );
    }
  }

  /**
   * Deletes an appointment
   * 
   * @param id - The ID of the appointment to delete
   * @returns True if the deletion was successful
   */
  static async deleteAppointment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new CalendarError(
          'Failed to delete appointment',
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
        'Failed to delete appointment',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Converts an appointment to a calendar event
   * 
   * @param appointment - The appointment to convert
   * @param userTimeZone - The timezone to convert to
   * @returns A calendar event
   */
  static toCalendarEvent(appointment: Appointment, userTimeZone: string): CalendarEvent {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(userTimeZone);
      
      // Convert start and end times to the user's timezone
      const start = TimeZoneService.convertTimeZone(
        appointment.start_time,
        appointment.time_zone,
        validTimeZone
      );
      
      const end = TimeZoneService.convertTimeZone(
        appointment.end_time,
        appointment.time_zone,
        validTimeZone
      );
      
      // Determine color based on status
      let backgroundColor = '#2196F3'; // Blue (default)
      let borderColor = '#1976D2';
      
      if (appointment.status === 'cancelled') {
        backgroundColor = '#F44336'; // Red
        borderColor = '#D32F2F';
      } else if (appointment.status === 'completed') {
        backgroundColor = '#9C27B0'; // Purple
        borderColor = '#7B1FA2';
      }
      
      return {
        id: appointment.id,
        title: appointment.type || 'Appointment',
        start,
        end,
        allDay: false,
        backgroundColor,
        borderColor,
        textColor: '#FFFFFF',
        extendedProps: {
          clinicianId: appointment.clinician_id,
          clientId: appointment.client_id,
          eventType: 'appointment',
          description: appointment.notes,
          isAvailability: false,
          isRecurring: !!appointment.recurrence_group_id,
          recurrenceId: appointment.recurrence_group_id,
          status: appointment.status,
          timezone: validTimeZone,
          sourceTimeZone: appointment.time_zone
        }
      };
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert appointment to calendar event',
        'CALENDAR_CONVERSION_ERROR',
        { appointment, userTimeZone, originalError: error }
      );
    }
  }
}