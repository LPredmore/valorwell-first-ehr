
import { isSameDay, isWithinInterval } from 'date-fns';
import { TimeBlock, AppointmentBlockType, TimeSlotUtils } from '../types/availability-types';

export const useTimeSlotUtils = (
  timeBlocks: TimeBlock[],
  appointmentBlocks: AppointmentBlockType[]
): TimeSlotUtils => {
  // Check if a time slot is available (has an availability block but no appointment)
  const isTimeSlotAvailable = (day: Date, timeSlot: Date): boolean => {
    // First check if there's an availability block for this slot
    const hasAvailability = timeBlocks.some(block => 
      isSameDay(block.day, day) && 
      isWithinInterval(timeSlot, { start: block.start, end: block.end })
    );
    
    if (!hasAvailability) return false;
    
    // Then check if there's no appointment for this slot
    const hasAppointment = appointmentBlocks.some(appt => 
      isSameDay(appt.day, day) && 
      isWithinInterval(timeSlot, { start: appt.start, end: appt.end })
    );
    
    return !hasAppointment;
  };

  // Get the availability block for a specific time slot
  const getBlockForTimeSlot = (day: Date, timeSlot: Date): TimeBlock | undefined => {
    return timeBlocks.find(block => 
      isSameDay(block.day, day) && 
      isWithinInterval(timeSlot, { start: block.start, end: block.end })
    );
  };

  // Get the appointment for a specific time slot
  const getAppointmentForTimeSlot = (day: Date, timeSlot: Date): AppointmentBlockType | undefined => {
    return appointmentBlocks.find(appt => 
      isSameDay(appt.day, day) && 
      isWithinInterval(timeSlot, { start: appt.start, end: appt.end })
    );
  };

  return {
    isTimeSlotAvailable,
    getBlockForTimeSlot,
    getAppointmentForTimeSlot
  };
};
