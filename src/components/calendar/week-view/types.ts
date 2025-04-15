
import { BaseAppointment } from '@/types/appointment';
import { TimeBlock } from "./useWeekViewData";

export interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: BaseAppointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: BaseAppointment) => void;
  onAvailabilityClick?: (day: Date, block: TimeBlock) => void;
  userTimeZone?: string;
}

// Re-export BaseAppointment for components that import from here
export type { BaseAppointment } from '@/types/appointment';
