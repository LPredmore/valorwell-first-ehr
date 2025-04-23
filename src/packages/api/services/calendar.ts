
import { supabase } from '../client';
import { handleApiError } from '../utils/error';
import { CalendarEvent } from '@/types/calendar';

// Calendar events CRUD operations
export const getCalendarEvents = async (clinicianId: string, userTimeZone: string, startDate?: Date, endDate?: Date) => {
  try {
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        recurrence_rules(*),
        calendar_exceptions(*)
      `)
      .eq('clinician_id', clinicianId)
      .eq('is_active', true);

    // Apply date range filter if provided
    if (startDate && endDate) {
      query = query.or(`start_time.gte.${startDate.toISOString()},end_time.lte.${endDate.toISOString()}`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Format events for calendar display
    const formattedEvents = data?.map(event => formatCalendarEvent(event, userTimeZone)) || [];
    return formattedEvents;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createCalendarEvent = async (event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        clinician_id: event.extendedProps?.clinicianId,
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        all_day: event.allDay || false,
        event_type: event.extendedProps?.eventType || 'appointment',
        description: event.extendedProps?.description,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Handle recurrence rules if present
    if (event.extendedProps?.recurrenceRule?.rrule) {
      await createRecurrenceRule(data.id, event.extendedProps.recurrenceRule.rrule);
    }

    return formatCalendarEvent(data, userTimeZone);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateCalendarEvent = async (event: CalendarEvent, userTimeZone: string): Promise<CalendarEvent> => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        all_day: event.allDay || false,
        description: event.extendedProps?.description
      })
      .eq('id', event.id)
      .select()
      .single();

    if (error) throw error;

    // Update recurrence rule if present
    if (event.extendedProps?.recurrenceRule?.rrule) {
      await updateRecurrenceRule(data.id, event.extendedProps.recurrenceRule.rrule);
    }

    return formatCalendarEvent(data, userTimeZone);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  try {
    // First delete any recurrence rules
    await supabase
      .from('recurrence_rules')
      .delete()
      .eq('event_id', eventId);
    
    // Then delete the event
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Availability management
export const getClinicianAvailability = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('event_type', 'availability')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAvailabilitySettings = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Recurrence rule management
export const createRecurrenceRule = async (eventId: string, rrule: string) => {
  try {
    const { data, error } = await supabase
      .from('recurrence_rules')
      .insert({
        event_id: eventId,
        rrule
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateRecurrenceRule = async (eventId: string, rrule: string) => {
  try {
    // Check if rule exists
    const { data: existingRule, error: checkError } = await supabase
      .from('recurrence_rules')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingRule) {
      // Update existing rule
      const { data, error } = await supabase
        .from('recurrence_rules')
        .update({ rrule })
        .eq('event_id', eventId)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Create new rule
      return await createRecurrenceRule(eventId, rrule);
    }
  } catch (error) {
    throw handleApiError(error);
  }
};

// Exception management for recurring events
export const createCalendarException = async (recurrenceEventId: string, exceptionDate: string, isCancelled: boolean = true) => {
  try {
    const { data, error } = await supabase
      .from('calendar_exceptions')
      .insert({
        recurrence_event_id: recurrenceEventId,
        exception_date: exceptionDate,
        is_cancelled: isCancelled
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function to format calendar events
const formatCalendarEvent = (event: any, userTimeZone: string): CalendarEvent => {
  // Transform database event to CalendarEvent type
  return {
    id: event.id,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    allDay: event.all_day,
    extendedProps: {
      eventType: event.event_type,
      description: event.description,
      clinicianId: event.clinician_id,
      recurrenceRule: event.recurrence_rules,
      exceptions: event.calendar_exceptions,
      googleEventId: event.google_event_id,
      is_active: event.is_active
    }
  };
};
