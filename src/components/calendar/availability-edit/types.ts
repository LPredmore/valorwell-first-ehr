
import { TimeBlock } from '../week-view/useWeekViewData';

export interface AvailabilityEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock: TimeBlock | any;
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

// Add the missing types that were referenced in the errors
export type OneTimeBlockType = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
};

export type DeleteDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  specificDate: Date;
  confirmDelete: () => void;
  isLoading: boolean;
  isRecurring: boolean;
};
