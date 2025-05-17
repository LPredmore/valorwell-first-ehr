
import { AppointmentType, AppointmentWithLuxon } from '@/types/appointment';
import { DateTime } from 'luxon';

/**
 * Convert an appointment format to one that uses Luxon-friendly times
 * This function handles appointments with ISO timestamps (start_at, end_at)
 */
export function convertAppointmentToLuxonFormat(appointment: AppointmentType, userTimeZone?: string): AppointmentWithLuxon {
  if (!appointment) {
    return {} as AppointmentWithLuxon;
  }

  const appointmentWithLuxon: AppointmentWithLuxon = { ...appointment };

  // If we have proper ISO format timestamps, use those directly
  if (appointment.start_at && appointment.end_at) {
    try {
      // Create Luxon DateTime objects from ISO strings
      appointmentWithLuxon._luxon_start = DateTime.fromISO(appointment.start_at);
      appointmentWithLuxon._luxon_end = DateTime.fromISO(appointment.end_at);
      
      // If we have a user timezone, ensure the DateTime objects are in that timezone
      if (userTimeZone) {
        appointmentWithLuxon._luxon_start = appointmentWithLuxon._luxon_start.setZone(userTimeZone);
        appointmentWithLuxon._luxon_end = appointmentWithLuxon._luxon_end.setZone(userTimeZone);
      }
      
      // Generate display fields
      appointmentWithLuxon.display_date = appointmentWithLuxon._luxon_start.toFormat('yyyy-MM-dd');
      appointmentWithLuxon.display_start_time = appointmentWithLuxon._luxon_start.toFormat('HH:mm');
      appointmentWithLuxon.display_end_time = appointmentWithLuxon._luxon_end.toFormat('HH:mm');
    } catch (error) {
      console.error('Error converting appointment to Luxon format:', error);
    }
  } 

  return appointmentWithLuxon;
}

/**
 * Format an appointment start and end times for display
 */
export function formatAppointmentTime(appointment: AppointmentType, userTimeZone: string = 'America/Chicago'): string {
  try {
    if (!appointment) return '';
    
    if (appointment.start_at && appointment.end_at) {
      // Use proper ISO timestamps
      const startDt = DateTime.fromISO(appointment.start_at).setZone(userTimeZone);
      const endDt = DateTime.fromISO(appointment.end_at).setZone(userTimeZone);
      
      return `${startDt.toFormat('h:mm a')} - ${endDt.toFormat('h:mm a')}`;
    }
    
    return 'Time not available';
  } catch (error) {
    console.error('Error formatting appointment time:', error);
    return 'Time error';
  }
}

/**
 * Format just the appointment date for display
 */
export function formatAppointmentDate(appointment: AppointmentType, userTimeZone: string = 'America/Chicago'): string {
  try {
    if (!appointment) return '';

    if (appointment.start_at) {
      // Use proper ISO timestamp
      const startDt = DateTime.fromISO(appointment.start_at).setZone(userTimeZone);
      return startDt.toFormat('EEEE, MMMM d, yyyy');
    }
    
    return 'Date not available';
  } catch (error) {
    console.error('Error formatting appointment date:', error);
    return 'Date error';
  }
}

/**
 * Process an array of appointments to add Luxon-friendly time objects
 */
export function processAppointmentsWithLuxon(
  appointments: AppointmentType[],
  userTimeZone?: string
): AppointmentWithLuxon[] {
  if (!appointments) return [];
  
  return appointments.map(appointment => {
    return convertAppointmentToLuxonFormat(appointment, userTimeZone);
  });
}
