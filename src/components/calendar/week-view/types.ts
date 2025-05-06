
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';

export interface TimeBlock {
  start: DateTime;
  end: DateTime;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
  day?: DateTime;
}

export interface AppointmentBlock {
  id: string;
  start: DateTime;
  end: DateTime;
  clientId: string;
  type: string;
  clientName?: string;
  day?: DateTime;
}

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
  isStandalone?: boolean;
}

export interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id?: string;
}
