import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { AppointmentType } from '@/types/appointment';
import { DateTime } from 'luxon';
import { parseISO } from 'date-fns';

export class CalendarService {
  static async getEvents(
    clinicianId: string,
    userTimeZone: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    console.log('[CalendarService] Fetching events:', { 
      clinicianId, 
      userTimeZone,
      startDate,
      endDate
    });
    
    try {
      const appointmentEvents = await this.getAppointments(clinicianId, startDate, endDate);
      const timeOffEvents = await this.getTimeOffEvents(clinicianId, startDate, endDate);
      
      return [
        ...appointmentEvents,
        ...timeOffEvents
      ];
    } catch (error) {
      console.error('[CalendarService] Error getting events:', error);
      throw error;
    }
  }

  private static async getAppointments(
    clinicianId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          date,
          start_time,
          end_time,
          type,
          status,
          notes,
          appointment_datetime,
          appointment_end_datetime,
          source_time_zone,
          client:client_id (
            client_first_name,
            client_last_name
          )
        `)
        .eq('clinician_id', clinicianId);
      
      if (startDate && endDate) {
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        query = query.gte('date', startDateString).lte('date', endDateString);
      }
      
      const { data: appointments, error } = await query;
      
      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
      
      return appointments.map((appointment: AppointmentType) => ({
        id: appointment.id,
        title: `${appointment.client?.client_first_name} ${appointment.client?.client_last_name} - ${appointment.type}`,
        start: appointment.appointment_datetime || `${appointment.date}T${appointment.start_time}`,
        end: appointment.appointment_end_datetime || `${appointment.date}T${appointment.end_time}`,
        extendedProps: {
          appointment: appointment,
          eventType: 'appointment' as CalendarEventType
        }
      }));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  private static async getTimeOffEvents(
    clinicianId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('time_off')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (startDate && endDate) {
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        query = query.gte('date', startDateString).lte('date', endDateString);
      }
      
      const { data: timeOffEvents, error } = await query;
      
      if (error) {
        console.error('Error fetching time off events:', error);
        throw error;
      }
      
      return timeOffEvents.map(timeOff => ({
        id: timeOff.id,
        title: 'Time Off',
        start: `${timeOff.date}T${timeOff.start_time}`,
        end: `${timeOff.date}T${timeOff.end_time}`,
        allDay: timeOff.all_day,
        extendedProps: {
          eventType: 'time_off' as CalendarEventType,
          description: timeOff.reason
        }
      }));
    } catch (error) {
      console.error('Error fetching time off events:', error);
      return [];
    }
  }

  static async createEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent | null> {
    try {
      if (event.extendedProps?.eventType === 'appointment') {
        const appointment = event.extendedProps.appointment;
        
        if (!appointment) {
          console.error('Appointment data is missing.');
          return null;
        }
        
        const { data, error } = await supabase
          .from('appointments')
          .insert([
            {
              client_id: appointment.client_id,
              clinician_id: appointment.clinician_id,
              date: appointment.date,
              start_time: appointment.start,
              end_time: appointment.end,
              type: appointment.type,
              status: appointment.status,
              notes: appointment.notes
            }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating appointment:', error);
          return null;
        }
        
        return {
          id: data.id,
          title: `${data.client_id} - ${data.type}`,
          start: data.start_time,
          end: data.end_time,
          extendedProps: {
            appointment: data,
            eventType: 'appointment' as CalendarEventType
          }
        };
      } else if (event.extendedProps?.eventType === 'time_off') {
        const { data, error } = await supabase
          .from('time_off')
          .insert([
            {
              clinician_id: event.clinicianId,
              date: event.start,
              start_time: event.start,
              end_time: event.end,
              all_day: event.allDay,
              reason: event.extendedProps.description
            }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating time off event:', error);
          return null;
        }
        
        return {
          id: data.id,
          title: 'Time Off',
          start: data.start_time,
          end: data.end_time,
          allDay: data.all_day,
          extendedProps: {
            eventType: 'time_off' as CalendarEventType,
            description: data.reason
          }
        };
      } else {
        console.warn('Unknown event type:', event);
        return null;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  static async updateEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent | null> {
    try {
      if (event.extendedProps?.eventType === 'appointment') {
        const appointment = event.extendedProps.appointment;
        
        if (!appointment) {
          console.error('Appointment data is missing.');
          return null;
        }
        
        const { data, error } = await supabase
          .from('appointments')
          .update({
            client_id: appointment.client_id,
            clinician_id: appointment.clinician_id,
            date: appointment.date,
            start_time: appointment.start,
            end_time: appointment.end,
            type: appointment.type,
            status: appointment.status,
            notes: appointment.notes
          })
          .eq('id', event.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating appointment:', error);
          return null;
        }
        
        return {
          id: data.id,
          title: `${data.client_id} - ${data.type}`,
          start: data.start_time,
          end: data.end_time,
          extendedProps: {
            appointment: data,
            eventType: 'appointment' as CalendarEventType
          }
        };
      } else if (event.extendedProps?.eventType === 'time_off') {
        const { data, error } = await supabase
          .from('time_off')
          .update({
            clinician_id: event.clinicianId,
            date: event.start,
            start_time: event.start,
            end_time: event.end,
            all_day: event.allDay,
            reason: event.extendedProps.description
          })
          .eq('id', event.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating time off event:', error);
          return null;
        }
        
        return {
          id: data.id,
          title: 'Time Off',
          start: data.start_time,
          end: data.end_time,
          allDay: data.all_day,
          extendedProps: {
            eventType: 'time_off' as CalendarEventType,
            description: data.reason
          }
        };
      } else {
        console.warn('Unknown event type:', event);
        return null;
      }
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', eventId)
        .select();
      
      if (appointmentError) {
        console.error('Error deleting appointment:', appointmentError);
        
        const { data: timeOffData, error: timeOffError } = await supabase
          .from('time_off')
          .delete()
          .eq('id', eventId)
          .select();
        
        if (timeOffError) {
          console.error('Error deleting time off event:', timeOffError);
          throw timeOffError;
        }
        
        if (!timeOffData) {
          console.warn('Event not found as appointment or time off:', eventId);
        }
      }
      
      if (!appointmentData) {
        console.warn('Event not found as appointment:', eventId);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
}
