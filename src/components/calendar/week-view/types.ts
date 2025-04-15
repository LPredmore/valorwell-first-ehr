import { Appointment } from '@/types/appointment';
import { TimeBlock } from "./useWeekViewData";

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

// Re-export Appointment for components that import from here
export type { Appointment } from '@/types/appointment';
