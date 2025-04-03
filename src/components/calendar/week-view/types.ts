
import { Appointment } from '@/hooks/useAppointments';

export interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: {
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    isException?: boolean;
  }) => void;
  userTimeZone?: string;
}

// Add a new interface for editing availability blocks
export interface AvailabilityBlockForEdit {
  id: string;
  day_of_week?: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
  isStandalone?: boolean;
  original_availability_id?: string | null;
}
