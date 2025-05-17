import { CalendarEvent } from '@/types/calendar';
import { AppointmentType } from '@/types/appointment';
import { DateTime } from 'luxon';

/**
 * Legacy field adapter - This function creates a backward-compatible appointment object
 * that includes the legacy fields (date, start_time, end_time) derived from the new format fields
 * This is used for components we can't directly modify
 */
export function adaptAppointmentForLegacyComponents(appointment: AppointmentType): AppointmentType {
  const result = { ...appointment };
  
  try {
    // Only add these fields if they don't exist and we have the new format fields
    if (appointment.start_at && !('date' in appointment)) {
      const startDt = DateTime.fromISO(appointment.start_at);
      const endDt = DateTime.fromISO(appointment.end_at);
      
      // Add the legacy fields for backward compatibility
      (result as any).date = startDt.toFormat('yyyy-MM-dd');
      (result as any).start_time = startDt.toFormat('HH:mm');
      (result as any).end_time = endDt.toFormat('HH:mm');
      
      // Also add appointment_datetime fields for components that expect them
      (result as any).appointment_datetime = appointment.start_at;
      (result as any).appointment_end_datetime = appointment.end_at;
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
