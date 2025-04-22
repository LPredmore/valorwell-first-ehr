
import { useState } from 'react';
import { TimeSlotValidation } from '@/utils/timeSlotValidation';
import { useToast } from '@/hooks/use-toast';

interface UseAvailabilityTimeSlotProps {
  dayIndex: number;
  onTimeSlotAdded?: () => Promise<void>;
  onTimeSlotError?: (error: Error) => void;
}

export const useAvailabilityTimeSlot = ({
  dayIndex,
  onTimeSlotAdded,
  onTimeSlotError
}: UseAvailabilityTimeSlotProps) => {
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const validateTimeSlot = (): boolean => {
    if (!TimeSlotValidation.isValidTimeRange(startTime, endTime)) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleTimeSlotAdd = async () => {
    if (!validateTimeSlot()) return;
    
    try {
      setIsAdding(true);
      
      if (onTimeSlotAdded) {
        await onTimeSlotAdded();
      }
      
      toast({
        title: "Success",
        description: `Availability added for ${TimeSlotValidation.getDayName(dayIndex)}`,
      });
    } catch (error) {
      console.error('Error adding time slot:', error);
      
      toast({
        title: "Error",
        description: "Failed to add availability slot. Please try again.",
        variant: "destructive"
      });
      
      if (onTimeSlotError && error instanceof Error) {
        onTimeSlotError(error);
      }
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
    handleTimeSlotAdd,
    validateTimeSlot
  };
};
