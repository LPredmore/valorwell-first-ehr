
import { TimeOption } from './utils';

export interface AvailabilityEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock: any;
  specificDate: Date | null;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
}

export interface DeleteDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  specificDate: Date;
  confirmDelete: () => void;
  isLoading: boolean;
  isRecurring?: boolean;
}

export interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  timeOptions: TimeOption[];
}
