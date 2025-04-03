
import { useMemo } from 'react';
import { isSameDay, setHours, setMinutes, startOfDay } from 'date-fns';
import { TimeBlock, AppointmentBlock, TimeSlotUtils } from '../types/availability-types';

export const useTimeSlotUtils = (
  timeBlocks: TimeBlock[],
  appointmentBlocks: AppointmentBlock[]
): TimeSlotUtils => {
  return useMemo(() => {
    const isTimeSlotAvailable = (day: Date, timeSlot: Date) => {
      const slotTime = setMinutes(
        setHours(startOfDay(day), timeSlot.getHours()),
        timeSlot.getMinutes()
      );
  
      return timeBlocks.some(block =>
        isSameDay(block.day, day) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
      const slotTime = setMinutes(
        setHours(startOfDay(day), timeSlot.getHours()),
        timeSlot.getMinutes()
      );
  
      return timeBlocks.find(block =>
        isSameDay(block.day, day) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
      const slotHours = timeSlot.getHours();
      const slotMinutes = timeSlot.getMinutes();
      
      const appointment = appointmentBlocks.find(block => {
        const sameDayCheck = isSameDay(block.day, day);
        if (!sameDayCheck) return false;
        
        const apptStartHours = block.start.getHours();
        const apptStartMinutes = block.start.getMinutes();
        const apptEndHours = block.end.getHours();
        const apptEndMinutes = block.end.getMinutes();
        
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const apptStartTotalMinutes = apptStartHours * 60 + apptStartMinutes;
        const apptEndTotalMinutes = apptEndHours * 60 + apptEndMinutes;
        
        return slotTotalMinutes >= apptStartTotalMinutes && 
               slotTotalMinutes < apptEndTotalMinutes;
      });
      
      return appointment;
    };

    return {
      isTimeSlotAvailable,
      getBlockForTimeSlot,
      getAppointmentForTimeSlot
    };
  }, [timeBlocks, appointmentBlocks]);
};
