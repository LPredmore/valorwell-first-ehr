
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, RecurrenceRule } from '@/types/calendar';
import { toast } from 'sonner';
import { AppointmentType } from '@/types/appointment';

// Create a new calendar event
export const createCalendarEvent = async (event: CalendarEvent) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        all_day: event.allDay,
        description: event.extendedProps?.description,
        event_type: event.extendedProps?.eventType,
        is_active: event.extendedProps?.is_active ?? true,
        clinician_id: event.clinicianId || event.extendedProps?.clinicianId
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createCalendarEvent:', error);
    return { success: false, error };
  }
};

// Update an existing calendar event
export const updateCalendarEvent = async (event: CalendarEvent) => {
  if (!event.id) {
    console.error('Event ID is required to update');
    return { success: false, error: 'Event ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        all_day: event.allDay,
        description: event.extendedProps?.description,
        is_active: event.extendedProps?.is_active ?? true
      })
      .eq('id', event.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCalendarEvent:', error);
    return { success: false, error };
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (eventId: string) => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCalendarEvent:', error);
    return { success: false, error };
  }
};

// Create a recurrence rule for an event
export const createRecurrenceRule = async (eventId: string, rrule: string) => {
  try {
    const { data, error } = await supabase
      .from('recurrence_rules')
      .insert({
        event_id: eventId,
        rrule
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating recurrence rule:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createRecurrenceRule:', error);
    return { success: false, error };
  }
};

// Create availability slots for a clinician
export const createAvailabilitySlots = async (clinicianId: string, slots: Array<{ start: Date, end: Date }>) => {
  try {
    const events = slots.map((slot) => ({
      title: 'Available',
      start_time: slot.start.toISOString(),
      end_time: slot.end.toISOString(),
      event_type: 'availability',
      all_day: false,
      clinician_id: clinicianId,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('calendar_events')
      .insert(events)
      .select('*');

    if (error) {
      console.error('Error creating availability slots:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createAvailabilitySlots:', error);
    return { success: false, error };
  }
};

// Create an appointment
export const createAppointment = async (
  clinicianId: string,
  clientId: string,
  date: string,
  startTime: string,
  endTime: string,
  appointmentType: string
) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        clinician_id: clinicianId,
        client_id: clientId,
        date,
        start_time: startTime,
        end_time: endTime,
        type: appointmentType,
        status: 'scheduled'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return { success: false, error };
    }

    // Create corresponding calendar event
    const calendarEvent: CalendarEvent = {
      title: `Appointment: ${appointmentType}`,
      start: `${date}T${startTime}`,
      end: `${date}T${endTime}`,
      allDay: false,
      extendedProps: {
        eventType: 'appointment',
        appointment: data as unknown as AppointmentType,
        clinicianId
      }
    };

    const calendarResult = await createCalendarEvent(calendarEvent);
    if (!calendarResult.success) {
      console.error('Error creating calendar event for appointment:', calendarResult.error);
      // Don't fail the whole operation if calendar event creation fails
      toast.error('Created appointment but failed to add it to the calendar.');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createAppointment:', error);
    return { success: false, error };
  }
};

// Get all calendar events for a clinician
export const getClinicianEvents = async (clinicianId: string, start?: string, end?: string) => {
  try {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('clinician_id', clinicianId);
    
    if (start) {
      query = query.gte('start_time', start);
    }
    
    if (end) {
      query = query.lte('end_time', end);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clinician events:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getClinicianEvents:', error);
    return { success: false, error };
  }
};
