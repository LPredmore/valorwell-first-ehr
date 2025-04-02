
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
  return differenceInMinutes(slotStartTime, appointment.start) < 30;
};
