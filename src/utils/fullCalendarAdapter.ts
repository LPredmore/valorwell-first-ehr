
import { AppointmentType, FullCalendarEvent, FullCalendarAvailabilityEvent } from '@/types/appointment';
import { TimeBlock } from '@/components/calendar/week-view/types';
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZoneUtils';

/**
 * Convert an appointment to a FullCalendar event
 */
export const appointmentToEvent = (
  appointment: AppointmentType,
  userTimeZone: string
): FullCalendarEvent => {
  const timezone = ensureIANATimeZone(userTimeZone);
  
  // Use _luxon_start/_luxon_end if available, otherwise build from date and times
  let startDate: Date;
  let endDate: Date;
  
  if (appointment._luxon_start && appointment._luxon_end) {
    startDate = appointment._luxon_start.toJSDate();
    endDate = appointment._luxon_end.toJSDate();
  } 
  else if (appointment.appointment_datetime && appointment.appointment_end_datetime) {
    // Use UTC timestamps if available
    startDate = DateTime.fromISO(appointment.appointment_datetime, { zone: 'utc' })
      .setZone(timezone)
      .toJSDate();
    
    endDate = DateTime.fromISO(appointment.appointment_end_datetime, { zone: 'utc' })
      .setZone(timezone)
      .toJSDate();
  } 
  else {
    // Fallback to date + time strings
    const dateStr = appointment.display_date || appointment.date;
    const startTimeStr = appointment.display_start_time || appointment.start_time;
    const endTimeStr = appointment.display_end_time || appointment.end_time;
    
    startDate = DateTime
      .fromFormat(`${dateStr} ${startTimeStr}`, 'yyyy-MM-dd HH:mm', { zone: timezone })
      .toJSDate();
    
    endDate = DateTime
      .fromFormat(`${dateStr} ${endTimeStr}`, 'yyyy-MM-dd HH:mm', { zone: timezone })
      .toJSDate();
  }
  
  // Get client name for title
  const title = appointment.client_name || 'Appointment';
  
  // Set event color based on status
  let backgroundColor = '#3788d8'; // Default blue
  let borderColor = '#2c6cb2';
  
  if (appointment.status === 'cancelled') {
    backgroundColor = '#e74c3c'; // Red for cancelled
    borderColor = '#c0392b';
  } else if (appointment.status === 'completed') {
    backgroundColor = '#2ecc71'; // Green for completed
    borderColor = '#27ae60';
  }
  
  return {
    id: appointment.id,
    title,
    start: startDate,
    end: endDate,
    backgroundColor,
    borderColor,
    extendedProps: {
      clientId: appointment.client_id,
      clientName: appointment.client_name,
      clinicianId: appointment.clinician_id,
      clinicianName: appointment.clinician_name,
      appointmentType: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      originalAppointment: appointment
    }
  };
};

/**
 * Convert multiple appointments to FullCalendar events
 */
export const appointmentsToEvents = (
  appointments: AppointmentType[],
  userTimeZone: string
): FullCalendarEvent[] => {
  return appointments.map(appointment => appointmentToEvent(appointment, userTimeZone));
};

/**
 * Convert availability time blocks to FullCalendar background events
 */
export const availabilityToEvents = (
  availabilityBlocks: TimeBlock[],
  userTimeZone: string
): FullCalendarAvailabilityEvent[] => {
  return availabilityBlocks.map(block => {
    return {
      id: `avail-${block.id || Math.random().toString(36).substring(2, 9)}`,
      title: 'Available',
      start: block.start,
      end: block.end,
      display: 'background',
      backgroundColor: 'rgba(76, 175, 80, 0.25)', // Light green with transparency
      borderColor: 'rgba(76, 175, 80, 0)',
      extendedProps: {
        isAvailability: true,
        availabilityId: block.id || ''
      }
    };
  });
};

/**
 * Convert a FullCalendar event back to an appointment
 * Used when events are dragged/resized in the calendar
 */
export const eventToAppointment = (
  event: FullCalendarEvent,
  userTimeZone: string
): AppointmentType => {
  const timezone = ensureIANATimeZone(userTimeZone);
  const originalAppointment = event.extendedProps?.originalAppointment;
  
  if (!originalAppointment) {
    throw new Error('Cannot convert event to appointment: missing original appointment data');
  }
  
  // Convert start and end to the format needed for appointment
  const startDt = DateTime.fromJSDate(event.start as Date, { zone: timezone });
  const endDt = DateTime.fromJSDate(event.end as Date, { zone: timezone });
  
  // Convert to UTC for storage
  const startUtc = startDt.toUTC().toISO();
  const endUtc = endDt.toUTC().toISO();
  
  return {
    ...originalAppointment,
    date: startDt.toFormat('yyyy-MM-dd'),
    start_time: startDt.toFormat('HH:mm'),
    end_time: endDt.toFormat('HH:mm'),
    display_date: startDt.toFormat('yyyy-MM-dd'),
    display_start_time: startDt.toFormat('HH:mm'),
    display_end_time: endDt.toFormat('HH:mm'),
    appointment_datetime: startUtc,
    appointment_end_datetime: endUtc,
    _luxon_start: startDt,
    _luxon_end: endDt
  };
};
