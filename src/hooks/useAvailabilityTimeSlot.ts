
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
    // Validate time range
    if (!TimeSlotValidation.isValidTimeRange(startTime, endTime)) {
      throw new Error('End time must be after start time');
    }

    // Validate time format
    if (!startTime.match(/^\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}$/)) {
      throw new Error('Invalid time format');
    }
  };

  const handleTimeSlotAdd = async () => {
    try {
      setIsAdding(true);
      validateTimeSlot();
      
      // Format time values for consistent storage
      const formattedStartTime = TimeSlotValidation.formatTimeString(startTime);
      const formattedEndTime = TimeSlotValidation.formatTimeString(endTime);
      
      console.log(`Time slot validated for day ${dayIndex}: ${formattedStartTime}-${formattedEndTime}`);
      
      // Notify parent of successful validation and time values
      onTimeSlotAdded?.();
      
      toast({
        title: "Time Slot Added",
        description: `Added availability for ${TimeSlotValidation.getDayName(dayIndex)}`,
      });

      // Reset form to default values
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
