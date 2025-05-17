
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { AppointmentType } from '@/types/appointment';
import { DateTime } from 'luxon';

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
      const availabilityEvents = await this.getAvailabilityEvents(clinicianId, startDate, endDate);
      
      return [
        ...appointmentEvents,
        ...availabilityEvents
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
          start_at,
          end_at,
          type,
          status,
          notes,
          video_room_url,
          clients:client_id (
            client_first_name,
            client_last_name
          )
        `)
        .eq('clinician_id', clinicianId);
      
      if (startDate && endDate) {
        query = query.gte('start_at', startDate.toISOString()).lte('start_at', endDate.toISOString());
      }
      
      const { data: appointments, error } = await query;
      
      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
      
      return appointments.map((appointment: any) => {
        const appointmentData: AppointmentType = {
          ...appointment,
          clinician_id: clinicianId
        };
        
        return {
          id: appointmentData.id,
          title: `${appointmentData.clients?.client_first_name || ''} ${appointmentData.clients?.client_last_name || ''} - ${appointmentData.type}`,
          start: appointmentData.start_at,
          end: appointmentData.end_at,
          extendedProps: {
            appointment: appointmentData,
            eventType: 'appointment' as CalendarEventType
          }
        };
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }
  
  private static async getAvailabilityEvents(
    clinicianId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('availability_blocks')
        .select(`
          id,
          clinician_id,
          start_at,
          end_at,
          is_active
        `)
        .eq('clinician_id', clinicianId);
      
      if (startDate && endDate) {
        const startDateString = startDate.toISOString();
        const endDateString = endDate.toISOString();
        query = query.gte('start_at', startDateString).lte('start_at', endDateString);
      }
      
      const { data: events, error } = await query;
      
      if (error) {
        console.error('Error fetching availability events:', error);
        throw error;
      }
      
      return events.map(event => {
        return {
          id: event.id,
          title: 'Available',
          start: event.start_at,
          end: event.end_at,
          backgroundColor: '#4ade80',
          borderColor: '#16a34a',
          textColor: '#052e16',
          extendedProps: {
            eventType: 'availability' as CalendarEventType,
            is_active: event.is_active,
          }
        };
      });
    } catch (error) {
      console.error('Error fetching availability events:', error);
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
              start_at: event.start,
              end_at: event.end,
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
          start: data.start_at,
          end: data.end_at,
          extendedProps: {
            appointment: data,
            eventType: 'appointment' as CalendarEventType
          }
        };
      } else if (event.extendedProps?.eventType === 'availability') {
        const { data, error } = await supabase
          .from('availability_blocks')
          .insert([
            {
              clinician_id: event.clinicianId,
              start_at: event.start,
              end_at: event.end,
              is_active: true
            }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating availability event:', error);
          return null;
        }
        
        return {
          id: data.id,
          title: 'Available',
          start: data.start_at,
          end: data.end_at,
          backgroundColor: '#4ade80',
          borderColor: '#16a34a',
          textColor: '#052e16',
          extendedProps: {
            eventType: 'availability' as CalendarEventType,
            is_active: data.is_active
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
            start_at: event.start,
            end_at: event.end
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
          start: data.start_at,
          end: data.end_at,
          extendedProps: {
            appointment: data,
            eventType: 'appointment' as CalendarEventType
          }
        };
      } else if (event.extendedProps?.eventType === 'availability') {
        const { data, error } = await supabase
          .from('availability_blocks')
          .update({
            start_at: event.start,
            end_at: event.end
          })
          .eq('id', event.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating availability event:', error);
          return null;
        }
        
        return {
          id: data.id,
          title: 'Available',
          start: data.start_at,
          end: data.end_at,
          backgroundColor: '#4ade80',
          borderColor: '#16a34a',
          textColor: '#052e16',
          extendedProps: {
            eventType: 'availability' as CalendarEventType,
            is_active: data.is_active
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
  
  static async deleteEvent(eventId: string, eventType: CalendarEventType): Promise<boolean> {
    try {
      if (eventType === 'appointment') {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', eventId);
        
        if (error) {
          console.error('Error deleting appointment:', error);
          return false;
        }
        
        return true;
      } else if (eventType === 'availability') {
        const { error } = await supabase
          .from('availability_blocks')
          .delete()
          .eq('id', eventId);
        
        if (error) {
          console.error('Error deleting availability event:', error);
          return false;
        }
        
        return true;
      } else {
        console.warn('Unknown event type for deletion:', eventType);
        return false;
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }
}
