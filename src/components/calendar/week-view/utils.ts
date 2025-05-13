
import { TimeBlock, AppointmentBlock } from './types';
import { DateTime } from 'luxon';

// Check if a slot is the start of an availability block
export const isStartOfBlock = (time: Date, block?: TimeBlock): boolean => {
  if (!block || !block.start) return false;

  // Convert JavaScript Date to Luxon DateTime
  const slotTime = DateTime.fromJSDate(time);
  
  // Use Luxon's hasSame method for more reliable comparison
  return block.start.hasSame(slotTime, 'hour') &&
         block.start.hasSame(slotTime, 'minute') &&
         block.start.hasSame(slotTime, 'day');
};

// Check if a slot is the end of an availability block
export const isEndOfBlock = (time: Date, block?: TimeBlock): boolean => {
  if (!block || !block.end) return false;

  // Convert JavaScript Date to Luxon DateTime and add 30 minutes (standard slot duration)
  const slotTime = DateTime.fromJSDate(time).plus({ minutes: 30 });
  
  // Compare using Luxon's hasSame
  return block.end.hasSame(slotTime, 'hour') &&
         block.end.hasSame(slotTime, 'minute') &&
         block.end.hasSame(slotTime, 'day');
};

// Check if a slot is the start of an appointment
export const isStartOfAppointment = (time: Date, appointment?: AppointmentBlock): boolean => {
  if (!appointment || !appointment.start) return false;
  
  // Convert JavaScript Date to Luxon DateTime
  const slotTime = DateTime.fromJSDate(time);
  
  // Compare using hasSame for more reliable comparison
  return appointment.start.hasSame(slotTime, 'minute') && 
         appointment.start.hasSame(slotTime, 'hour') && 
         appointment.start.hasSame(slotTime, 'day');
};

// Check if a time is within an appointment block
export const isWithinAppointment = (time: Date, appointment?: AppointmentBlock): boolean => {
  if (!appointment || !appointment.start || !appointment.end) return false;
  
  // Convert JavaScript Date to Luxon DateTime for consistent comparison
  const slotTime = DateTime.fromJSDate(time);
  
  // Use Luxon's comparison operators
  return slotTime >= appointment.start && slotTime < appointment.end;
};
