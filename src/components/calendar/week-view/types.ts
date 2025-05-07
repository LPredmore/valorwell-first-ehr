
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

// Updated to match the availability_blocks table schema
export interface AvailabilityBlock {
  id: string;
  clinician_id: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  recurring_pattern?: any;
  day_of_week?: string; // For compatibility with previous code
  start_time?: string;  // For compatibility with previous code
  end_time?: string;    // For compatibility with previous code
  isException?: boolean;
  isStandalone?: boolean;
}

// Maintaining for compatibility until full refactoring
export interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id?: string;
}
