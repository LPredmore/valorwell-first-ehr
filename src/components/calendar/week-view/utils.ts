
import { TimeBlock, AppointmentBlock } from './types';

// Check if a time is the start of an availability block
export const isStartOfBlock = (time: Date, block?: TimeBlock): boolean => {
  if (!block) return false;
  
  // Convert JavaScript Date to milliseconds for comparison
  const timeMs = time.getTime();
  
  // DateTime from Luxon has toMillis() method to convert to milliseconds
  const blockStartMs = block.start.toMillis();
  
  // Check if the times are within a minute of each other
  return Math.abs(timeMs - blockStartMs) < 60000;
};

// Check if a time is the end of an availability block
export const isEndOfBlock = (time: Date, block?: TimeBlock): boolean => {
  if (!block) return false;
  
  // Convert JavaScript Date to milliseconds for comparison
  const timeMs = time.getTime();
  
  // Add 30 minutes to timeMs for accurate end comparison (since our slots are 30min)
  const timeEndMs = timeMs + 30 * 60 * 1000;
  
  // DateTime from Luxon has toMillis() method to convert to milliseconds
  const blockEndMs = block.end.toMillis();
  
  // Check if the times are within a minute of each other
  return Math.abs(timeEndMs - blockEndMs) < 60000;
};

// Check if a time is the start of an appointment
export const isStartOfAppointment = (time: Date, appointment?: AppointmentBlock): boolean => {
  if (!appointment) return false;
  
  // Convert JavaScript Date to milliseconds for comparison
  const timeMs = time.getTime();
  
  // DateTime from Luxon has toMillis() method to convert to milliseconds
  const appointmentStartMs = appointment.start.toMillis();
  
  // Check if the times are within a minute of each other
  return Math.abs(timeMs - appointmentStartMs) < 60000;
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
