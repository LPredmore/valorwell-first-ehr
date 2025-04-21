
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TimeSlotValidation } from '@/utils/timeSlotValidation';

interface UseAvailabilityTimeSlotProps {
  dayIndex: number;
  onTimeSlotAdded?: () => void;
  onTimeSlotError?: (error: Error) => void;
}

export const useAvailabilityTimeSlot = ({
  dayIndex,
  onTimeSlotAdded,
  onTimeSlotError
}: UseAvailabilityTimeSlotProps) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const validateTimeSlot = () => {
    if (!TimeSlotValidation.isValidTimeRange(startTime, endTime)) {
      throw new Error('End time must be after start time');
    }
  };

  const handleTimeSlotAdd = async () => {
    try {
      setIsAdding(true);
      validateTimeSlot();
      
      // Format time values for consistent storage
      const formattedStartTime = TimeSlotValidation.formatTimeString(startTime);
      const formattedEndTime = TimeSlotValidation.formatTimeString(endTime);
      
      onTimeSlotAdded?.();
      
      toast({
        title: "Time Slot Added",
        description: `Added availability for ${TimeSlotValidation.getDayName(dayIndex)}`,
      });

      // Reset form
      setStartTime('09:00');
      setEndTime('17:00');
    } catch (error) {
      console.error('Error adding time slot:', error);
      onTimeSlotError?.(error as Error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add time slot',
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isAdding,
    handleTimeSlotAdd
  };
};
