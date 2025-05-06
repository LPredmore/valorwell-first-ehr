
import { addMinutes, differenceInMinutes } from 'date-fns';
import { DateTime } from 'luxon';
import { TimeBlock, AppointmentBlock } from './types';

// Helper function to check if a time slot is at the start of a block
export function isStartOfBlock(timeSlot: Date, block: TimeBlock | null): boolean {
  if (!block) return false;
  
  // Convert DateTime to JS Date for comparison
  const blockStartDate = block.start.toJSDate();
  return differenceInMinutes(timeSlot, blockStartDate) < 30;
}

// Helper function to check if a time slot is at the end of a block
export function isEndOfBlock(timeSlot: Date, block: TimeBlock | null): boolean {
  if (!block) return false;
  
  // Convert DateTime to JS Date for comparison
  const blockEndDate = block.end.toJSDate();
  return differenceInMinutes(blockEndDate, addMinutes(timeSlot, 30)) < 30;
}

// Helper function to check if a time slot is at the start of an appointment
export function isStartOfAppointment(timeSlot: Date, appointment: AppointmentBlock | null): boolean {
  if (!appointment) return false;
  
  // Convert DateTime to JS Date for comparison
  const appointmentStartDate = appointment.start.toJSDate();
  return differenceInMinutes(timeSlot, appointmentStartDate) < 30;
}
