import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { AppointmentType } from '@/types/appointment';
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

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
      // Ensure we have a valid IANA timezone
      const validTimeZone = ensureIANATimeZone(userTimeZone);
      
      const appointmentEvents = await this.getAppointments(clinicianId, startDate, endDate);
      const timeOffEvents = await this.getTimeOffEvents(clinicianId, startDate, endDate);
      const availabilityEvents = await this.getAvailabilityEvents(clinicianId, startDate, endDate);
      
      return [
        ...appointmentEvents,
        ...timeOffEvents,
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
        console.error('[CalendarService] Error fetching appointments:', error);
        throw error;
      }
      
      return appointments.map((appointment: any) => {
        const appointmentData: AppointmentType = {
          ...appointment,
          clinician_id: clinicianId
        };
        
        return {
          id: appointmentData.id,
          title: `${appointmentData.client?.client_first_name} ${appointmentData.client?.client_last_name} - ${appointmentData.type}`,
          start: appointmentData.appointment_datetime || `${appointmentData.date}T${appointmentData.start_time}`,
          end: appointmentData.appointment_end_datetime || `${appointmentData.date}T${appointmentData.end_time}`,
          extendedProps: {
            appointment: appointmentData,
            eventType: 'appointment' as CalendarEventType
          }
        };
      });
    } catch (error) {
      console.error('[CalendarService] Error fetching appointments:', error);
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
        console.error('[CalendarService] Error fetching time off events:', error);
        throw error;
      }

      return (timeOffEvents || []).map(timeOff => ({
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
      console.error('[CalendarService] Error fetching time off events:', error);
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
        .from('calendar_events')
        .select(`
          id,
          title,
          start_time,
          end_time,
          description,
          recurrence_id,
          is_active
        `)
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true);

      if (startDate && endDate) {
        const startDateString = startDate.toISOString();
        const endDateString = endDate.toISOString();
        query = query.gte('start_time', startDateString).lte('start_time', endDateString);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('[CalendarService] Error fetching availability events:', error);
        throw error;
      }

      // To get recurrence rules, we need a follow-up query for each event with recurrence_id
      const eventsWithRecurrence = await Promise.all(
        (events || []).map(async (event) => {
          let recurrenceRule = undefined;
          if (event.recurrence_id) {
            // Fetch rrule from recurrence_rules by recurrence_id
            const { data: recurrenceRules, error: recurrenceError } = await supabase
              .from('recurrence_rules')
              .select('rrule')
              .eq('id', event.recurrence_id)
              .maybeSingle();
            
            if (!recurrenceError && recurrenceRules) {
              recurrenceRule = {
                id: event.recurrence_id,
                eventId: event.id,
                rrule: recurrenceRules.rrule
              };
            }
          }
          return {
            id: event.id,
            title: event.title || 'Available',
            start: event.start_time,
            end: event.end_time,
            backgroundColor: '#4ade80',
            borderColor: '#16a34a',
            textColor: '#052e16',
            extendedProps: {
              eventType: 'availability' as CalendarEventType,
              description: event.description || 'Available for appointments',
              recurrenceRule
            }
          };
        })
      );
      return eventsWithRecurrence;
    } catch (error) {
      console.error('[CalendarService] Error fetching availability events:', error);
      return [];
    }
  }

  static async createEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent | null> {
    try {
      // Ensure we have a valid IANA timezone
      const validTimeZone = ensureIANATimeZone(userTimeZone);
      
      if (event.extendedProps?.eventType === 'appointment') {
        const appointment = event.extendedProps.appointment;
        
        if (!appointment) {
          console.error('[CalendarService] Appointment data is missing.');
          return null;
        }
        
        // Convert times to UTC for storage
        let startTime = event.start?.toString();
        let endTime = event.end?.toString();
        
        if (startTime && endTime) {
          const startDateTime = DateTime.fromISO(startTime, { zone: validTimeZone }).toUTC();
          const endDateTime = DateTime.fromISO(endTime, { zone: validTimeZone }).toUTC();
          
          const { data, error } = await supabase
            .from('appointments')
            .insert([
              {
                client_id: appointment.client_id,
                clinician_id: appointment.clinician_id,
                date: startDateTime.toFormat('yyyy-MM-dd'),
                start_time: startDateTime.toFormat('HH:mm:ss'),
                end_time: endDateTime.toFormat('HH:mm:ss'),
                appointment_datetime: startDateTime.toISO(),
                appointment_end_datetime: endDateTime.toISO(),
                source_time_zone: validTimeZone,
                type: appointment.type,
                status: appointment.status,
                notes: appointment.notes
              }
            ])
            .select()
            .single();
          
          if (error) {
            console.error('[CalendarService] Error creating appointment:', error);
            return null;
          }
          
          return {
            id: data.id,
            title: `${data.client_id} - ${data.type}`,
            start: data.appointment_datetime,
            end: data.appointment_end_datetime,
            extendedProps: {
              appointment: data,
              eventType: 'appointment' as CalendarEventType
            }
          };
        } else {
          console.error('[CalendarService] Invalid start or end time for appointment');
          return null;
        }
      } else if (event.extendedProps?.eventType === 'time_off') {
        // Convert times to UTC for storage
        let startTime = event.start?.toString();
        let endTime = event.end?.toString();
        
        if (startTime && endTime) {
          const startDateTime = DateTime.fromISO(startTime, { zone: validTimeZone }).toUTC();
          const endDateTime = DateTime.fromISO(endTime, { zone: validTimeZone }).toUTC();
          
          const { data, error } = await supabase
            .from('time_off')
            .insert([
              {
                clinician_id: event.clinicianId,
                date: startDateTime.toFormat('yyyy-MM-dd'),
                start_time: startDateTime.toFormat('HH:mm:ss'),
                end_time: endDateTime.toFormat('HH:mm:ss'),
                all_day: event.allDay,
                reason: event.extendedProps.description,
                source_time_zone: validTimeZone
              }
            ])
            .select()
            .single();
          
          if (error) {
            console.error('[CalendarService] Error creating time off event:', error);
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
          console.error('[CalendarService] Invalid start or end time for time off');
          return null;
        }
      } else if (event.extendedProps?.eventType === 'availability') {
        // Convert times to UTC for storage
        let startTime = event.start?.toString();
        let endTime = event.end?.toString();
        
        if (startTime && endTime) {
          const startDateTime = DateTime.fromISO(startTime, { zone: validTimeZone }).toUTC();
          const endDateTime = DateTime.fromISO(endTime, { zone: validTimeZone }).toUTC();
          
          const { data, error } = await supabase
            .from('calendar_events')
            .insert([
              {
                clinician_id: event.clinicianId,
                event_type: 'availability',
                title: event.title || 'Available',
                start_time: startDateTime.toISO(),
                end_time: endDateTime.toISO(),
                all_day: event.allDay || false,
                description: event.extendedProps?.description,
                is_active: true,
                source_time_zone: validTimeZone
              }
            ])
            .select()
            .single();
          
          if (error) {
            console.error('[CalendarService] Error creating availability event:', error);
            return null;
          }
          
          // Handle recurrence if applicable
          if (event.extendedProps?.recurrenceRule?.rrule && data.id) {
            const { data: recurrenceData, error: recurrenceError } = await supabase
              .from('recurrence_rules')
              .insert([{
                event_id: data.id,
                rrule: event.extendedProps.recurrenceRule.rrule
              }])
              .select()
              .single();
              
            if (recurrenceError) {
              console.error('[CalendarService] Error creating recurrence rule:', recurrenceError);
              // Continue anyway as the event is created
            } else if (recurrenceData) {
              // Update the event with the recurrence ID
              await supabase
                .from('calendar_events')
                .update({ recurrence_id: recurrenceData.id })
                .eq('id', data.id);
            }
          }
          
          return {
            id: data.id,
            title: data.title,
            start: data.start_time,
            end: data.end_time,
            allDay: data.all_day,
            backgroundColor: '#4ade80',
            borderColor: '#16a34a',
            textColor: '#052e16',
            extendedProps: {
              eventType: 'availability' as CalendarEventType,
              description: data.description
            }
          };
        } else {
          console.error('[CalendarService] Invalid start or end time for availability');
          return null;
        }
      } else {
        console.warn('[CalendarService] Unknown event type:', event);
        return null;
      }
    } catch (error) {
      console.error('[CalendarService] Error creating event:', error);
      return null;
    }
  }

  static async updateEvent(event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent | null> {
    try {
      // Ensure we have a valid IANA timezone
      const validTimeZone = ensureIANATimeZone(userTimeZone);
      
      if (event.extendedProps?.eventType === 'appointment') {
        const appointment = event.extendedProps.appointment;
        
        if (!appointment) {
          console.error('[CalendarService] Appointment data is missing.');
          return null;
        }
        
        // Convert times to UTC for storage
        let startTime = event.start?.toString();
        let endTime = event.end?.toString();
        
        if (startTime && endTime) {
          const startDateTime = DateTime.fromISO(startTime, { zone: validTimeZone }).toUTC();
          const endDateTime = DateTime.fromISO(endTime, { zone: validTimeZone }).toUTC();
          
          const { data, error } = await supabase
            .from('appointments')
            .update({
              client_id: appointment.client_id,
              clinician_id: appointment.clinician_id,
              date: startDateTime.toFormat('yyyy-MM-dd'),
              start_time: startDateTime.toFormat('HH:mm:ss'),
              end_time: endDateTime.toFormat('HH:mm:ss'),
              appointment_datetime: startDateTime.toISO(),
              appointment_end_datetime: endDateTime.toISO(),
              source_time_zone: validTimeZone,
              type: appointment.type,
              status: appointment.status,
              notes: appointment.notes
            })
            .eq('id', event.id)
            .select()
            .single();
          
          if (error) {
            console.error('[CalendarService] Error updating appointment:', error);
            return null;
          }
          
          return {
            id: data.id,
            title: `${data.client_id} - ${data.type}`,
            start: data.appointment_datetime,
            end: data.appointment_end_datetime,
            extendedProps: {
              appointment: data,
              eventType: 'appointment' as CalendarEventType
            }
          };
        } else {
          console.error('[CalendarService] Invalid start or end time for appointment update');
          return null;
        }
      } else if (event.extendedProps?.eventType === 'time_off') {
        // Convert times to UTC for storage
        let startTime = event.start?.toString();
        let endTime = event.end?.toString();
        
        if (startTime && endTime) {
          const startDateTime = DateTime.fromISO(startTime, { zone: validTimeZone }).toUTC();
          const endDateTime = DateTime.fromISO(endTime, { zone: validTimeZone }).toUTC();
          
          const { data, error } = await supabase
            .from('time_off')
            .update({
              clinician_id: event.clinicianId,
              date: startDateTime.toFormat('yyyy-MM-dd'),
              start_time: startDateTime.toFormat('HH:mm:ss'),
              end_time: endDateTime.toFormat('HH:mm:ss'),
              all_day: event.allDay,
              reason: event.extendedProps.description,
              source_time_zone: validTimeZone
            })
            .eq('id', event.id)
            .select()
            .single();
          
          if (error) {
            console.error('[CalendarService] Error updating time off event:', error);
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
          console.error('[CalendarService] Invalid start or end time for time off update');
          return null;
        }
      } else if (event.extendedProps?.eventType === 'availability') {
        // Convert times to UTC for storage
        let startTime = event.start?.toString();
        let endTime = event.end?.toString();
        
        if (startTime && endTime) {
          const startDateTime = DateTime.fromISO(startTime, { zone: validTimeZone }).toUTC();
          const endDateTime = DateTime.fromISO(endTime, { zone: validTimeZone }).toUTC();
          
          const { data, error } = await supabase
            .from('calendar_events')
            .update({
              title: event.title || 'Available',
              start_time: startDateTime.toISO(),
              end_time: endDateTime.toISO(),
              all_day: event.allDay || false,
              description: event.extendedProps?.description,
              source_time_zone: validTimeZone
            })
            .eq('id', event.id)
            .eq('event_type', 'availability')
            .select()
            .single();
          
          if (error) {
            console.error('[CalendarService] Error updating availability event:', error);
            return null;
          }
          
          // Update recurrence rule if applicable
          if (event.extendedProps?.recurrenceRule?.rrule) {
            const { data: eventData, error: eventError } = await supabase
              .from('calendar_events')
              .select('recurrence_id')
              .eq('id', event.id)
              .single();
              
            if (!eventError && eventData?.recurrence_id) {
              await supabase
                .from('recurrence_rules')
                .update({ rrule: event.extendedProps.recurrenceRule.rrule })
                .eq('id', eventData.recurrence_id);
            }
          }
          
          return {
            id: data.id,
            title: data.title,
            start: data.start_time,
            end: data.end_time,
            allDay: data.all_day,
            backgroundColor: '#4ade80',
            borderColor: '#16a34a',
            textColor: '#052e16',
            extendedProps: {
              eventType: 'availability' as CalendarEventType,
              description: data.description
            }
          };
        } else {
          console.error('[CalendarService] Invalid start or end time for availability update');
          return null;
        }
      } else {
        console.warn('[CalendarService] Unknown event type for update:', event);
        return null;
      }
    } catch (error) {
      console.error('[CalendarService] Error updating event:', error);
      return null;
    }
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      // First check if this is a recurrence parent
      const { data: recurrenceData, error: recurrenceError } = await supabase
        .from('recurrence_rules')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();
        
      if (!recurrenceError && recurrenceData?.id) {
        // Delete all events in the series
        const { error: eventsError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('recurrence_id', recurrenceData.id);
          
        if (eventsError) {
          console.error('[CalendarService] Error deleting recurring events:', eventsError);
          return false;
        }
          
        // Delete the recurrence rule
        const { error: ruleError } = await supabase
          .from('recurrence_rules')
          .delete()
          .eq('id', recurrenceData.id);
          
        if (ruleError) {
          console.error('[CalendarService] Error deleting recurrence rule:', ruleError);
          return false;
        }
        
        return true;
      }
      
      // Check if this is an appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', eventId)
        .maybeSingle();
        
      if (!appointmentError && appointmentData?.id) {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', eventId);
          
        if (error) {
          console.error('[CalendarService] Error deleting appointment:', error);
          return false;
        }
        
        return true;
      }
      
      // Check if this is a time off event
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off')
        .select('id')
        .eq('id', eventId)
        .maybeSingle();
        
      if (!timeOffError && timeOffData?.id) {
        const { error } = await supabase
          .from('time_off')
          .delete()
          .eq('id', eventId);
          
        if (error) {
          console.error('[CalendarService] Error deleting time off event:', error);
          return false;
        }
        
        return true;
      }
      
      // Otherwise, assume it's a regular availability event
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('event_type', 'availability');
        
      if (error) {
        console.error('[CalendarService] Error deleting availability event:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[CalendarService] Error deleting event:', error);
      return false;
    }
  }
}
