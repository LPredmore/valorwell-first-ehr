import { format } from 'date-fns';
import { fromUTCTimestamp, ensureIANATimeZone } from './timeZoneUtils';
import { fromUTCToTimezone, formatDateTime } from './luxonTimeUtils';
import { DateTime } from 'luxon';
import { AppointmentType } from '@/types/appointment';

/**
 * Convert an appointment to the user's time zone for display
 * @param appointment The appointment object
 * @param userTimeZone The user's time zone
 * @returns The appointment with display fields added for the user's time zone
 */
export const getAppointmentInUserTimeZone = (
  appointment: AppointmentType, 
  userTimeZone: string
): AppointmentType => {
  try {
    const validTimeZone = ensureIANATimeZone(userTimeZone);
    
    // If appointment has UTC timestamps, use them for conversion
    if (appointment.appointment_datetime && appointment.appointment_end_datetime) {
      console.log(`Converting appointment from UTC to ${validTimeZone}:`, {
        id: appointment.id,
        utcStart: appointment.appointment_datetime,
        utcEnd: appointment.appointment_end_datetime,
        sourceTimeZone: appointment.source_time_zone || 'unknown'
      });
      
      // Check if source time zone matches user time zone to prevent double conversion
      // Only perform this check if source_time_zone is defined
      if (appointment.source_time_zone && 
          ensureIANATimeZone(appointment.source_time_zone) === validTimeZone) {
        console.log(`Source and target time zones match (${validTimeZone}), using original times`);
        return {
          ...appointment,
          display_date: appointment.date,
          display_start_time: appointment.start_time,
          display_end_time: appointment.end_time
        };
      }
      
      // Use Luxon for better time zone conversion
      try {
        const startDateTime = fromUTCToTimezone(appointment.appointment_datetime, validTimeZone);
        const endDateTime = fromUTCToTimezone(appointment.appointment_end_datetime, validTimeZone);
        
        return {
          ...appointment,
          display_date: startDateTime.toFormat('yyyy-MM-dd'),
          display_start_time: startDateTime.toFormat('HH:mm'),
          display_end_time: endDateTime.toFormat('HH:mm'),
          // Add Luxon DateTime objects for components that can use them
          _luxon_start: startDateTime,
          _luxon_end: endDateTime
        };
      } catch (error) {
        console.error('Error using Luxon for time conversion:', error);
        
        // Fall back to the original method if Luxon fails
        const localStart = fromUTCTimestamp(appointment.appointment_datetime, validTimeZone);
        const localEnd = fromUTCTimestamp(appointment.appointment_end_datetime, validTimeZone);
        
        return {
          ...appointment,
          display_date: format(localStart, 'yyyy-MM-dd'),
          display_start_time: format(localStart, 'HH:mm'),
          display_end_time: format(localEnd, 'HH:mm')
        };
      }
    }
    
    // Fallback to original values if no UTC timestamps
    console.log(`No UTC timestamps for appointment ${appointment.id}, using original values`);
    return {
      ...appointment,
      display_date: appointment.date,
      display_start_time: appointment.start_time,
      display_end_time: appointment.end_time
    };
  } catch (error) {
    console.error('Error converting appointment to user time zone:', error, {
      appointmentId: appointment.id,
      userTimeZone
    });
    
    // Return original appointment with same display values as a fallback
    return {
      ...appointment,
      display_date: appointment.date,
      display_start_time: appointment.start_time,
      display_end_time: appointment.end_time
    };
  }
};

/**
 * Convert a list of appointments to the user's time zone for display
 * @param appointments Array of appointment objects
 * @param userTimeZone The user's time zone
 * @returns Array of appointments with display fields added for the user's time zone
 */
export const getAppointmentsInUserTimeZone = (
  appointments: AppointmentType[],
  userTimeZone: string
): AppointmentType[] => {
  return appointments.map(appointment => getAppointmentInUserTimeZone(appointment, userTimeZone));
};

/**
 * Check if an appointment has proper time zone information
 * @param appointment The appointment to check
 * @returns Boolean indicating if the appointment has time zone information
 */
export const hasTimeZoneInfo = (
  appointment: AppointmentType
): boolean => {
  return !!(appointment.appointment_datetime && appointment.appointment_end_datetime);
};

/**
 * Format appointment time for display with time zone indicator
 * @param appointment The appointment object
 * @param userTimeZone The user's time zone
 * @returns Formatted time string with time zone indicator
 */
export const formatAppointmentTimeWithTimeZone = (
  appointment: AppointmentType,
  userTimeZone: string
): string => {
  try {
    const validTimeZone = ensureIANATimeZone(userTimeZone);
    const displayTime = appointment.display_start_time || appointment.start_time;
    const timeZoneName = validTimeZone.split('/').pop()?.replace('_', ' ') || validTimeZone;
    
    // Format as "9:00 AM (Chicago)"
    const [hours, minutes] = displayTime.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm} (${timeZoneName})`;
  } catch (error) {
    console.error('Error formatting appointment time with time zone:', error);
    return `${appointment.start_time} (${userTimeZone})`;
  }
};

/**
 * Format appointment time for display with time zone indicator using Luxon
 * @param appointment The appointment object
 * @param userTimeZone The user's time zone
 * @returns Formatted time string with time zone indicator
 */
export const formatAppointmentTimeWithLuxon = (
  appointment: AppointmentType,
  userTimeZone: string
): string => {
  try {
    const validTimeZone = ensureIANATimeZone(userTimeZone);
    const displayTime = appointment.display_start_time || appointment.start_time;
    
    // If we have a Luxon DateTime from previous processing
    if (appointment._luxon_start && appointment._luxon_start instanceof DateTime) {
      return appointment._luxon_start.toFormat('h:mm a ZZZZ');
    }
    
    // Create a Luxon DateTime from the date and time
    const date = appointment.display_date || appointment.date;
    const dateTime = DateTime.fromFormat(
      `${date} ${displayTime}`, 
      'yyyy-MM-dd HH:mm', 
      { zone: validTimeZone }
    );
    
    return dateTime.toFormat('h:mm a ZZZZ');
  } catch (error) {
    console.error('Error formatting appointment time with Luxon:', error);
    return `${appointment.start_time} (${userTimeZone})`;
  }
};
