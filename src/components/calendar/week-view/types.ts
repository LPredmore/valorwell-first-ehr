
import { Appointment } from '@/types/appointment';

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
}

export interface TimeBlock {
  id?: string;
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  type?: 'block' | 'unblock';
}

export interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, block: TimeBlock) => void;
  userTimeZone?: string;
}
