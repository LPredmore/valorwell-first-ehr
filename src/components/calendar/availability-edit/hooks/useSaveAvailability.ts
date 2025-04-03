
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  checkExistingException, 
  updateException, 
  createException, 
  updateRecurringSeries 
} from '../api/availabilityEditService';

/**
 * Hook for saving availability changes
 */
export const useSaveAvailability = (
  availabilityBlock: any,
  specificDate: Date | null,
  clinicianId: string | null,
  startTime: string,
  endTime: string,
  setIsLoading: (loading: boolean) => void,
  setIsEditChoiceDialogOpen: (open: boolean) => void,
  isRecurring: boolean,
  isException: boolean,
  isStandalone: boolean,
  onAvailabilityUpdated: () => void,
  onClose: () => void
) => {
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  const handleSaveClick = () => {
    if (isRecurring && !isException) {
      setIsEditChoiceDialogOpen(true);
    } else {
      saveChanges('single');
    }
  };

  const handleEditSingle = () => {
    setEditMode('single');
    setIsEditChoiceDialogOpen(false);
    saveChanges('single');
  };

  const handleEditSeries = () => {
    setEditMode('series');
    setIsEditChoiceDialogOpen(false);
    saveChanges('series');
  };

  const saveChanges = async (mode: 'single' | 'series') => {
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      if (mode === 'single') {
        if (isRecurring && !isException) {
          // Create or update an exception to the recurring availability
          console.log('Creating exception for recurring availability:', {
            clinicianId,
            specificDate: specificDateStr,
            originalAvailabilityId: availabilityBlock.id,
            startTime,
            endTime
          });
          
          // Check if an exception already exists
          const { exists, data: existingException } = await checkExistingException(
            specificDateStr, 
            clinicianId, 
            availabilityBlock.id
          );
          
          if (exists && existingException) {
            console.log('Updating existing exception:', existingException);
            // Update existing exception
            await updateException(existingException.id, startTime, endTime);
            toast.success("Updated existing modified availability");
          } else {
            console.log('Creating new exception');
            // Create new exception
            await createException(
              clinicianId,
              specificDateStr,
              availabilityBlock.id,
              startTime,
              endTime,
              false
            );
            toast.success("Availability updated for this occurrence only");
          }
        } else if (isException) {
          // Update an existing exception
          console.log('Updating existing exception:', {
            id: availabilityBlock.id,
            startTime,
            endTime
          });
          
          await updateException(availabilityBlock.id, startTime, endTime);
          toast.success("Modified availability updated");
        } else if (isStandalone) {
          // Update a standalone one-time availability
          console.log('Updating standalone availability:', {
            id: availabilityBlock.id,
            startTime,
            endTime
          });
          
          await updateException(availabilityBlock.id, startTime, endTime);
          toast.success("One-time availability updated");
        } else {
          // Create a new one-time availability
          console.log('Creating new one-time availability:', {
            clinicianId,
            specificDate: specificDateStr,
            startTime,
            endTime
          });
          
          // Check if a standalone availability already exists
          const { exists, data: existingAvailability } = await checkExistingException(
            specificDateStr, 
            clinicianId
          );
          
          if (exists && existingAvailability) {
            // Update existing standalone availability
            await updateException(existingAvailability.id, startTime, endTime);
            toast.success("Existing one-time availability updated");
          } else {
            // Create new standalone availability
            await createException(
              clinicianId,
              specificDateStr,
              null,
              startTime,
              endTime,
              false
            );
            toast.success("New one-time availability created");
          }
        }
      } else if (mode === 'series' && isRecurring) {
        // Update the recurring series
        console.log('Updating recurring series:', {
          id: availabilityBlock.id,
          startTime,
          endTime
        });
        
        await updateRecurringSeries(availabilityBlock.id, startTime, endTime);
        toast.success("All recurring availabilities updated");
      }
      
      onAvailabilityUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error("Failed to update availability");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSaveClick,
    handleEditSingle,
    handleEditSeries,
    saveChanges
  };
};
