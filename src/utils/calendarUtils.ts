
import { CalendarEvent } from '@/types/calendar';
import { AppointmentType } from '@/types/appointment';
import { DateTime } from 'luxon';

/**
 * Legacy field adapter - This function creates a backward-compatible appointment object
 * that includes the legacy fields derived from the new format fields
 * This is used for components we haven't yet updated to use the new schema
 */
export function adaptAppointmentForLegacyComponents(appointment: AppointmentType): AppointmentType {
  const result = { ...appointment };
  
  try {
    // Only add these fields if we have the ISO timestamps
    if (appointment.start_at) {
      const startDt = DateTime.fromISO(appointment.start_at);
      const endDt = DateTime.fromISO(appointment.end_at);
      
      // For backward compatibility with components that expect separate date and time fields
      const displayDate = startDt.toFormat('yyyy-MM-dd');
      const displayStartTime = startDt.toFormat('HH:mm');
      const displayEndTime = endDt.toFormat('HH:mm');
      
      result.display_date = displayDate;
      result.display_start_time = displayStartTime;
      result.display_end_time = displayEndTime;
    }
  } catch (error) {
    console.error('Error adapting appointment for legacy components:', error);
  }
  
  return result;
}

/**
 * Process appointments to make them compatible with legacy components
 */
export function processAppointmentsForLegacyComponents(appointments: AppointmentType[]): AppointmentType[] {
  if (!appointments) return [];
  
  return appointments.map(adaptAppointmentForLegacyComponents);
}

/**
 * Converts a calendar event to an appointment object
 */
export function calendarEventToAppointment(event: CalendarEvent): AppointmentType | null {
  if (!event) return null;
  
  // If this is an appointment event, return the existing appointment
  if (event.extendedProps?.appointment) {
    return adaptAppointmentForLegacyComponents(event.extendedProps.appointment);
  }
  
  // Otherwise create a new appointment from the event
  const appointment: AppointmentType = {
    id: event.id as string,
    client_id: '',
    clinician_id: event.clinicianId || '',
    type: 'Appointment',
    status: 'scheduled',
    start_at: event.start?.toString() || '',
    end_at: event.end?.toString() || '',
  };
  
  return adaptAppointmentForLegacyComponents(appointment);
}
