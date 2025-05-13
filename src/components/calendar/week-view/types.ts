
import { DateTime } from 'luxon';
import { AvailabilityBlock } from '@/types/availability';

// Re-export using the proper syntax for types with isolatedModules
export type { AvailabilityBlock };

export interface TimeBlock {
  start: DateTime;
  end: DateTime;
  day: DateTime;
  availabilityIds: string[];
  isException: boolean;
  isStandalone: boolean;
  
  // For backward compatibility
  start_at?: string;
  end_at?: string;
}

export interface AppointmentBlock {
  id: string;
  start: DateTime;
  end: DateTime;
  day: DateTime;
  clientId: string;
  clientName: string;
  type: string;
  
  // For backward compatibility
  start_at?: string;
  end_at?: string;
}

export interface AvailabilityException {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  day_of_week?: string;
  specific_date: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}
