
import { useAvailabilityFetching } from './useAvailabilityFetching';
import { useAppointmentProcessing } from './useAppointmentProcessing';
import { useAvailabilityProcessing } from './useAvailabilityProcessing';
import { useTimeSlotUtils } from './useTimeSlotUtils';
import { UseWeekViewDataParams, WeekViewDataResult } from '../types/availability-types';

export const useWeekViewData = ({
  days,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client'
}: UseWeekViewDataParams): WeekViewDataResult => {
  // Fetch availability data
  const { 
    loading, 
    availabilityBlocks, 
    exceptions 
  } = useAvailabilityFetching(days, clinicianId, refreshTrigger);

  // Process appointments
  const { appointmentBlocks } = useAppointmentProcessing(appointments, getClientName);

  // Process availability and exceptions
  const { 
    timeBlocks, 
    getAvailabilityForBlock 
  } = useAvailabilityProcessing(days, availabilityBlocks, exceptions);

  // Get time slot utility functions
  const timeSlotUtils = useTimeSlotUtils(timeBlocks, appointmentBlocks);

  return {
    loading,
    timeBlocks,
    appointmentBlocks,
    exceptions,
    availabilityBlocks,
    getAvailabilityForBlock,
    ...timeSlotUtils
  };
};
