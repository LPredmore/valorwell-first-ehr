
import { AppointmentType } from '@/types/appointment';
import { CalendarEvent } from '@/types/calendar';
import { ensureIANATimeZone } from './timeZoneUtils';
import { DateTime } from 'luxon';

/**
 * Convert appointments to FullCalendar events format
 * @param appointments Array of appointment objects
 * @param userTimeZone The user's time zone
 * @returns Array of events formatted for FullCalendar
 */
export const convertAppointmentsToEvents = (
  appointments: AppointmentType[],
  userTimeZone: string
): CalendarEvent[] => {
  if (!appointments || appointments.length === 0) {
    return [];
  }

  const timeZone = ensureIANATimeZone(userTimeZone);
  console.log(`[calendarUtils] Converting ${appointments.length} appointments to events with timezone: ${timeZone}`);

  return appointments.map(appointment => {
    // Determine if we should use UTC timestamps or local date/time strings
    const useUtcTimestamp = !!appointment.appointment_datetime;
    
    let startDate: string, endDate: string;
    
    if (useUtcTimestamp && appointment.appointment_datetime && appointment.appointment_end_datetime) {
      // Use UTC timestamps directly (FullCalendar will handle timezone conversion)
      startDate = appointment.appointment_datetime;
      endDate = appointment.appointment_end_datetime;
    } else {
      // Construct ISO strings from date and time fields
      const date = appointment.display_date || appointment.date;
      const startTime = appointment.display_start_time || appointment.start_time;
      const endTime = appointment.display_end_time || appointment.end_time;
      
      startDate = `${date}T${startTime}`;
      endDate = `${date}T${endTime}`;
    }
    
    // Generate event title using client name if available
    let title = 'Appointment';
    if (appointment.client) {
      title = `${appointment.client.client_first_name} ${appointment.client.client_last_name}`;
    } else if (appointment.clientName) {
      title = appointment.clientName;
    }
    
    // Set color based on appointment status
    let color: string;
    switch (appointment.status?.toLowerCase()) {
      case 'scheduled':
        color = '#4CAF50'; // Green
        break;
      case 'cancelled':
        color = '#F44336'; // Red
        break;
      case 'completed':
        color = '#9E9E9E'; // Gray
        break;
      case 'no-show':
        color = '#FF9800'; // Orange
        break;
      default:
        color = '#2196F3'; // Blue
    }

    return {
      id: appointment.id,
      title,
      start: startDate,
      end: endDate,
      color,
      extendedProps: {
        appointment
      }
    };
  });
};

/**
 * Convert availability blocks to FullCalendar events
 * @param availabilityBlocks Array of availability blocks
 * @param userTimeZone The user's time zone
 * @returns Array of events formatted for FullCalendar
 */
export const convertAvailabilityToEvents = (availabilityBlocks: any[], userTimeZone: string): CalendarEvent[] => {
  if (!availabilityBlocks || availabilityBlocks.length === 0) {
    return [];
  }

  return availabilityBlocks.map(block => {
    // Construct event for the availability block
    return {
      id: `avail-${block.id}`,
      title: 'Available',
      start: block.start,
      end: block.end,
      color: 'rgba(76, 175, 80, 0.3)', // Transparent green
      rendering: 'background',
      extendedProps: {
        isAvailability: true,
        availabilityBlock: block
      }
    };
  });
};
