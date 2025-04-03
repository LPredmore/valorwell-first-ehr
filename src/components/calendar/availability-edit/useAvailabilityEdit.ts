
import { useAvailabilityState } from './hooks/useAvailabilityState';
import { useSaveAvailability } from './hooks/useSaveAvailability';
import { useDeleteAvailability } from './hooks/useDeleteAvailability';

export const useAvailabilityEdit = (
  isOpen: boolean,
  onClose: () => void,
  availabilityBlock: any,
  specificDate: Date | null,
  clinicianId: string | null,
  onAvailabilityUpdated: () => void
) => {
  // Use the availability state hook
  const {
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
  } = useAvailabilityState(isOpen, availabilityBlock, specificDate);

  // Use the save availability hook
  const {
    handleSaveClick,
    handleEditSingle,
    handleEditSeries
  } = useSaveAvailability(
    availabilityBlock,
    specificDate,
    clinicianId,
    startTime,
    endTime,
    setIsLoading,
    setIsEditChoiceDialogOpen,
    isRecurring,
    isException,
    isStandalone,
    onAvailabilityUpdated,
    onClose
  );

  // Use the delete availability hook
  const {
    handleDeleteClick,
    confirmDelete
  } = useDeleteAvailability(
    availabilityBlock,
    specificDate,
    clinicianId,
    setIsLoading,
    setIsDeleteDialogOpen,
    isRecurring,
    isException,
    isStandalone,
    onAvailabilityUpdated,
    onClose
  );

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
    isRecurring,
    isException,
    isStandalone,
    isEditChoiceDialogOpen,
    setIsEditChoiceDialogOpen,
    handleEditSingle,
    handleEditSeries
  };
};
