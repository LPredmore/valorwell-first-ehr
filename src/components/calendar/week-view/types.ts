
import { Appointment } from '@/hooks/useAppointments';
import { TimeBlock } from './useWeekViewData';

export interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: TimeBlock) => void;
  userTimeZone?: string;
}
