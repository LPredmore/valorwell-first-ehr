
import { TimeBlock } from '../week-view/useWeekViewData';

export interface AvailabilityEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock: any;
  specificDate: Date | null;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
}

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  specificDate: Date;
  confirmDelete: () => void;
  isLoading: boolean;
  isRecurring: boolean;
}
