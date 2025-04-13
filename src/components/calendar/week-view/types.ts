
import { TimeBlock } from './useWeekViewData';

export interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (day: Date, block: TimeBlock) => void;
  userTimeZone?: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  date: string; 
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  appointment_datetime?: string;  // UTC timestamp
  appointment_end_datetime?: string; // UTC end timestamp
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
