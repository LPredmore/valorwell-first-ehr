
import { format } from 'date-fns';
import { DateTime } from 'luxon';
import { BaseAppointment, AppointmentWithLuxon } from '@/types/appointment';
import { TimeZoneService } from '@/utils/timezone';

export const getAppointmentInUserTimeZone = (
  appointment: BaseAppointment, 
  userTimeZone: string
): AppointmentWithLuxon => {
  try {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
    if (appointment.appointment_datetime && appointment.appointment_end_datetime) {
      console.log(`Converting appointment from UTC to ${validTimeZone}:`, {
        id: appointment.id,
        utcStart: appointment.appointment_datetime,
        utcEnd: appointment.appointment_end_datetime,
        sourceTimeZone: appointment.source_time_zone || 'unknown'
      });
      
      if (appointment.source_time_zone && 
          TimeZoneService.ensureIANATimeZone(appointment.source_time_zone) === validTimeZone) {
        console.log(`Source and target time zones match (${validTimeZone}), using original times`);
        return {
          ...appointment,
          display_date: appointment.date,
          display_start_time: appointment.startTime || appointment.start_time,
          display_end_time: appointment.endTime || appointment.end_time,
          // Ensure all required properties exist
          startTime: appointment.startTime || appointment.start_time,
          endTime: appointment.endTime || appointment.end_time,
          clientName: appointment.clientName,
          clientId: appointment.clientId || appointment.client_id,
          clinician_id: appointment.clinician_id
        };
      }
      
      try {
        const startDateTime = TimeZoneService.fromUTC(appointment.appointment_datetime, userTimeZone);
        const endDateTime = TimeZoneService.fromUTC(appointment.appointment_end_datetime, userTimeZone);
        
        return {
          ...appointment,
          display_date: startDateTime.toFormat('yyyy-MM-dd'),
          display_start_time: startDateTime.toFormat('HH:mm'),
          display_end_time: endDateTime.toFormat('HH:mm'),
          _luxon_start: startDateTime,
          _luxon_end: endDateTime,
          // Ensure all required properties exist
          startTime: appointment.startTime || appointment.start_time,
          endTime: appointment.endTime || appointment.end_time,
          clientName: appointment.clientName,
          clientId: appointment.clientId || appointment.client_id,
          clinician_id: appointment.clinician_id
        };
      } catch (error) {
        console.error('Error using Luxon for time conversion:', error);
        return appointment as AppointmentWithLuxon;
      }
    }
    
    return {
      ...appointment,
      display_date: appointment.date,
      display_start_time: appointment.startTime || appointment.start_time,
      display_end_time: appointment.endTime || appointment.end_time,
      // Ensure all required properties exist
      startTime: appointment.startTime || appointment.start_time,
      endTime: appointment.endTime || appointment.end_time,
      clientName: appointment.clientName,
      clientId: appointment.clientId || appointment.client_id,
      clinician_id: appointment.clinician_id
    };
  } catch (error) {
    console.error('Error converting appointment to user time zone:', error);
    return appointment as AppointmentWithLuxon;
  }
};

/**
 * Convert a list of appointments to the user's time zone for display
 * @param appointments Array of appointment objects
 * @param userTimeZone The user's time zone
 * @returns Array of appointments with display fields added for the user's time zone
 */
export const getAppointmentsInUserTimeZone = (
  appointments: BaseAppointment[],
  userTimeZone: string
): BaseAppointment[] => {
  return appointments.map(appointment => getAppointmentInUserTimeZone(appointment, userTimeZone));
};

/**
 * Check if an appointment has proper time zone information
 * @param appointment The appointment to check
 * @returns Boolean indicating if the appointment has time zone information
 */
export const hasTimeZoneInfo = (appointment: BaseAppointment): boolean => {
  return !!(appointment.appointment_datetime && appointment.appointment_end_datetime);
};

/**
 * Format appointment time for display with time zone indicator
 * @param appointment The appointment object
 * @param userTimeZone The user's time zone
 * @returns Formatted time string with time zone indicator
 */
export const formatAppointmentTimeWithTimeZone = (
  appointment: BaseAppointment,
  userTimeZone: string
): string => {
  try {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    const displayTime = appointment.display_start_time || appointment.startTime;
    const timeZoneName = validTimeZone.split('/').pop()?.replace('_', ' ') || validTimeZone;
    
    const [hours, minutes] = displayTime.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm} (${timeZoneName})`;
  } catch (error) {
    console.error('Error formatting appointment time with time zone:', error);
    return `${appointment.startTime} (${userTimeZone})`;
  }
};

/**
 * Format appointment time for display with time zone indicator using Luxon
 * @param appointment The appointment object
 * @param userTimeZone The user's time zone
 * @returns Formatted time string with time zone indicator
 */
export const formatAppointmentTimeWithLuxon = (
  appointment: AppointmentWithLuxon,
  userTimeZone: string
): string => {
  try {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    const displayTime = appointment.display_start_time || appointment.startTime;
    
    if (appointment._luxon_start && appointment._luxon_start instanceof DateTime) {
      return appointment._luxon_start.toFormat('h:mm a ZZZZ');
    }
    
    const date = appointment.display_date || appointment.date;
    const dateTime = DateTime.fromFormat(
      `${date} ${displayTime}`, 
      'yyyy-MM-dd HH:mm', 
      { zone: validTimeZone }
    );
    
    return dateTime.toFormat('h:mm a ZZZZ');
  } catch (error) {
    console.error('Error formatting appointment time with Luxon:', error);
    return `${appointment.startTime} (${userTimeZone})`;
  }
};
