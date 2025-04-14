
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

// Unified appointment type with both UTC and legacy fields
export interface AppointmentWithAllFields {
  id: string;
  client_id: string;
  type: string;
  status: string;
  // UTC timestamp fields (new format)
  appointment_datetime: string;
  appointment_end_datetime: string;
  // Legacy fields (for backward compatibility)
  date?: string;
  start_time?: string;
  end_time?: string;
  // Optional fields
  video_room_url?: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
}
