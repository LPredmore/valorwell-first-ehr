
import { Appointment, TimeBlock } from "./useWeekViewData";

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

export interface BaseAppointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  clinician_id?: string;
  video_room_url?: string | null;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;
  appointment_datetime?: string;
  appointment_end_datetime?: string;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
}
