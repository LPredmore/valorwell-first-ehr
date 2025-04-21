
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAvailability } from '../availability/AvailabilityContext';

export const useAvailabilityEdit = (
  isOpen,
  onClose,
  availabilityBlock,
  specificDate,
  clinicianId,
  onAvailabilityUpdated
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const { toast } = useToast();
  const {
    updateAvailabilitySlot,
    removeAvailabilitySlot
  } = useAvailability();

  // Generate time options for dropdowns (30 min increments)
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`);
    timeOptions.push(`${hour}:30`);
  }

  useEffect(() => {
    if (isOpen && availabilityBlock) {
      setStartTime(availabilityBlock.start_time || '09:00');
      setEndTime(availabilityBlock.end_time || '10:00');
      setError(null); // Reset error state when dialog opens
      console.log('AvailabilityEditDialog: Initialized with times', {
        startTime: availabilityBlock.start_time,
        endTime: availabilityBlock.end_time
      });
    }
  }, [isOpen, availabilityBlock]);

  const validateTimes = () => {
    // Convert times to numbers for comparison (e.g., "09:30" -> 9.5)
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    
    const startNum = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
    const endNum = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
    
    if (startNum >= endNum) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSaveClick = async () => {
    try {
      if (!validateTimes()) return;
      
      // Reset any previous errors
      setError(null);
      setIsLoading(true);
      
      if (!availabilityBlock || !availabilityBlock.id) {
        setError(new Error('Missing availability block information'));
        toast({
          title: "Error",
          description: "Missing availability information. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update the availability slot
      await updateAvailabilitySlot(availabilityBlock.id, startTime, endTime);
      
      toast({
        title: "Success",
        description: "Availability has been updated.",
      });
      
      if (onAvailabilityUpdated) {
        onAvailabilityUpdated();
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving availability:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset any previous errors
      
      if (!availabilityBlock || !availabilityBlock.id) {
        setError(new Error('Missing availability block information'));
        toast({
          title: "Error",
          description: "Missing availability information. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await removeAvailabilitySlot(availabilityBlock.id);
      
      toast({
        title: "Success",
        description: "Availability has been deleted.",
      });
      
      if (onAvailabilityUpdated) {
        onAvailabilityUpdated();
      }
      
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to delete availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    timeOptions,
    handleSaveClick,
    handleDeleteClick,
    confirmDelete,
    error // Include error in the return object
  };
};
