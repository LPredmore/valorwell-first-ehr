
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

  const validateTimeSlot = (): boolean => {
    try {
      // Validate time range
      if (!TimeSlotValidation.isValidTimeRange(startTime, endTime)) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return false;
      }

      // Validate time format
      if (!startTime.match(/^\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}$/)) {
        toast({
          title: "Invalid Format",
          description: "Time must be in HH:MM format",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Time slot validation error:", error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Invalid time format",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleTimeSlotAdd = async () => {
    if (isAdding) {
      console.log("Already processing a request, please wait");
      return;
    }
    
    try {
      setIsAdding(true);
      
      // First validate the input
      if (!validateTimeSlot()) {
        setIsAdding(false);
        return;
      }
      
      // Format time values for consistent storage
      const formattedStartTime = TimeSlotValidation.formatTimeString(startTime);
      const formattedEndTime = TimeSlotValidation.formatTimeString(endTime);
      
      console.log(`Time slot validated for day ${dayIndex}: ${formattedStartTime}-${formattedEndTime}`);
      
      // Notify parent of successful validation and time values
      await onTimeSlotAdded?.();
      
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
