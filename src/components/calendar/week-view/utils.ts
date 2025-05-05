
import { differenceInMinutes, addMinutes } from 'date-fns';
import { TimeBlock, AppointmentBlock } from './useWeekViewData';

export const isStartOfBlock = (
  slotStartTime: Date,
  currentBlock?: TimeBlock
): boolean => {
  if (!currentBlock) return false;
  return differenceInMinutes(slotStartTime, currentBlock.start) < 30;
};

export const isEndOfBlock = (
  slotStartTime: Date,
  slotEndTime: Date,
  currentBlock?: TimeBlock
): boolean => {
  if (!currentBlock) return false;
  return differenceInMinutes(currentBlock.end, slotEndTime) < 30;
};

export const isStartOfAppointment = (
  slotStartTime: Date,
  appointment?: AppointmentBlock
): boolean => {
  if (!appointment) return false;
  
  // Compare hours and minutes only (ignore date part)
  const slotHours = slotStartTime.getHours();
  const slotMinutes = slotStartTime.getMinutes();
  const appointmentHours = appointment.start.getHours();
  const appointmentMinutes = appointment.start.getMinutes();
  
  // Check if the slot start time is within 30 minutes of the appointment start time
  return slotHours === appointmentHours && 
         Math.abs(slotMinutes - appointmentMinutes) < 30;
};
