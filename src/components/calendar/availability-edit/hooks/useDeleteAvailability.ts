
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  checkExistingException, 
  updateException, 
  createException, 
  deactivateRecurringSeries 
} from '../api/availabilityEditService';

/**
 * Hook for handling availability deletion
 */
export const useDeleteAvailability = (
  availabilityBlock: any,
  specificDate: Date | null,
  clinicianId: string | null,
  setIsLoading: (loading: boolean) => void,
  setIsDeleteDialogOpen: (open: boolean) => void,
  isRecurring: boolean,
  isException: boolean,
  isStandalone: boolean,
  onAvailabilityUpdated: () => void,
  onClose: () => void
) => {
  const handleDeleteClick = () => {
    console.log('Delete clicked for availability:', {
      isRecurring,
      isException,
      isStandalone,
      availabilityBlock
    });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async (deleteMode: 'single' | 'series' = 'single') => {
    if (!specificDate || !clinicianId) {
      console.error('Missing required data for deletion:', { specificDate, clinicianId });
      return;
    }
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    console.log('Confirming deletion:', {
      deleteMode,
      specificDateStr,
      clinicianId,
      isRecurring,
      isException,
      isStandalone,
      availabilityBlockId: availabilityBlock?.id
    });
    
    try {
      if (deleteMode === 'single') {
        // Handle single occurrence deletion
        if (isRecurring && !isException) {
          // Create a deletion exception for the recurring availability
          console.log('Creating deletion exception for recurring availability:', {
            clinicianId,
            specificDate: specificDateStr,
            originalAvailabilityId: availabilityBlock.id
          });
          
          // Check if an exception already exists
          const { exists, data: existingException } = await checkExistingException(
            specificDateStr, 
            clinicianId, 
            availabilityBlock.id
          );
          
          if (exists && existingException) {
            console.log('Updating existing exception to mark as deleted:', existingException);
            // Update existing exception to mark as deleted
            await updateException(existingException.id, null, null, true);
            toast.success("Availability cancelled for this occurrence only");
          } else {
            console.log('Creating new deletion exception');
            // Create new deletion exception
            await createException(
              clinicianId,
              specificDateStr,
              availabilityBlock.id,
              null,
              null,
              true
            );
            toast.success("Availability cancelled for this occurrence only");
          }
        } else if (isException || isStandalone) {
          // Delete the exception or standalone availability
          console.log('Deleting exception or standalone availability:', {
            id: availabilityBlock.id,
            isException,
            isStandalone
          });
          
          await updateException(availabilityBlock.id, null, null, true);
          
          if (isException) {
            toast.success("Modified availability cancelled");
          } else {
            toast.success("One-time availability cancelled");
          }
        }
      } else if (deleteMode === 'series' && isRecurring) {
        // Delete the entire recurring series
        console.log('Deleting entire recurring series:', {
          id: availabilityBlock.id
        });
        
        await deactivateRecurringSeries(availabilityBlock.id);
        toast.success("Recurring availability series cancelled");
      }
      
      onAvailabilityUpdated();
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error("Failed to cancel availability");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleDeleteClick,
    confirmDelete
  };
};
