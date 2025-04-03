
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { generateTimeOptions, TimeOption } from '../utils';

/**
 * Hook for managing the state of availability editing
 */
export const useAvailabilityState = (
  isOpen: boolean,
  availabilityBlock: any,
  specificDate: Date | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isException, setIsException] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isEditChoiceDialogOpen, setIsEditChoiceDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  useEffect(() => {
    if (isOpen && availabilityBlock && specificDate) {
      console.log('Editing availability block:', availabilityBlock);
      
      // Determine the type of availability block
      setIsRecurring(!availabilityBlock.isStandalone);
      setIsException(!!availabilityBlock.isException);
      setIsStandalone(!!availabilityBlock.isStandalone);
      
      // Set initial times from the block
      if (availabilityBlock.start_time) {
        setStartTime(availabilityBlock.start_time.slice(0, 5));
      } else if (availabilityBlock.start) {
        setStartTime(format(availabilityBlock.start, 'HH:mm'));
      }
      
      if (availabilityBlock.end_time) {
        setEndTime(availabilityBlock.end_time.slice(0, 5));
      } else if (availabilityBlock.end) {
        setEndTime(format(availabilityBlock.end, 'HH:mm'));
      }
      
      // Generate time options in 15-minute increments
      setTimeOptions(generateTimeOptions());
    }
  }, [isOpen, availabilityBlock, specificDate]);

  return {
    isLoading,
    setIsLoading,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    timeOptions,
    isRecurring,
    isException,
    isStandalone,
    isEditChoiceDialogOpen,
    setIsEditChoiceDialogOpen,
    editMode,
    setEditMode
  };
};
