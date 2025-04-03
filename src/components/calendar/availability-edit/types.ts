
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
  specificDate: Date | null;
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

export interface OneTimeBlockType {
  id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
  is_deleted: boolean;
  isException?: boolean;
  isStandalone?: boolean;
  original_availability_id?: string | null;
}
