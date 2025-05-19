
import { Dispatch, SetStateAction } from 'react';

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
  isStandalone?: boolean;
  originalAvailabilityId?: string | null;
}

export interface AvailabilityEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock: AvailabilityBlock | null;
  specificDate: Date | null;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
}

export interface DeleteDialogProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  specificDate: Date | null;
  confirmDelete: () => Promise<void>;
  isLoading: boolean;
}

export interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  timeOptions: string[];
}
