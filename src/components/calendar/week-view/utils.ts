
import { TimeBlock, AppointmentBlock } from './types';
import { DateTime } from 'luxon';

// Check if a slot is the start of an availability block
export const isStartOfBlock = (time: Date, block?: TimeBlock): boolean => {
  if (!block) return false;

  // Parse block start_at as a UTC DateTime
  const appointmentStart = block.start_at ? DateTime.fromISO(block.start_at, { zone: 'utc' }) : block.start;
  // Convert JavaScript Date to clinician's local time
  const slotTime = DateTime.fromJSDate(time);

  // Check minute/hour/day for accurate block matching
  return appointmentStart.hasSame(slotTime, 'hour') &&
         appointmentStart.hasSame(slotTime, 'minute') &&
         appointmentStart.hasSame(slotTime, 'day');
};

// Check if a slot is the end of an availability block (with 45-minute buffer)
export const isEndOfBlock = (time: Date, block?: TimeBlock): boolean => {
  if (!block) return false;

  // Parse block end_at as a UTC DateTime
  const appointmentEnd = block.end_at ? DateTime.fromISO(block.end_at, { zone: 'utc' }) : block.end;
  // Convert JavaScript Date to clinician's time
  const slotTime = DateTime.fromJSDate(time).plus({ minutes: 45 });

  // Compare in clinician's local timezone
  return appointmentEnd.hasSame(slotTime, 'hour') &&
         appointmentEnd.hasSame(slotTime, 'minute') &&
         appointmentEnd.hasSame(slotTime, 'day');
};

// Check if a slot is the start of an appointment (proper UTC conversion)
export const isStartOfAppointment = (time: Date, appointment?: AppointmentBlock): boolean => {
  if (!appointment?.start_at) return false;
  
  // Convert appointment start_at (UTC) to clinician's local time
  const appointmentStart = appointment.start_at ? DateTime.fromISO(appointment.start_at, { zone: 'utc' }) : appointment.start;
  const slotTime = DateTime.fromJSDate(time);

  // Check hour/minute/day (instead of 'minuteOfDay' which doesn't exist)
  return appointmentStart.hasSame(slotTime, 'minute') && 
         appointmentStart.hasSame(slotTime, 'hour') && 
         appointmentStart.hasSame(slotTime, 'day');
};

// Check if a time is within an appointment block
export const isWithinAppointment = (time: Date, appointment?: AppointmentBlock): boolean => {
  if (!appointment) return false;
  
  // Convert JavaScript Date to milliseconds for comparison
  const timeMs = time.getTime();
  
  // DateTime from Luxon has toMillis() method to convert to milliseconds
  const appointmentStartMs = appointment.start.toMillis();
  const appointmentEndMs = appointment.end.toMillis();
  
  // Check if the time is within the appointment
  return timeMs >= appointmentStartMs && timeMs < appointmentEndMs;
};
