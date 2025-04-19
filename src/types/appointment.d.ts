
import { DateTime } from "luxon";

export interface BaseAppointment {
  id: string;
  client_id: string;
  clinician_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  notes?: string;
  appointment_datetime?: string;
  appointment_end_datetime?: string;
  source_time_zone?: string;
  video_room_url?: string;
  recurring_group_id?: string;
}

export interface AppointmentType extends BaseAppointment {
  client_name?: string;
  clinician_name?: string;
  // Display fields for time zone conversion
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
  // Luxon DateTime objects for better time handling
  _luxon_start?: DateTime;
  _luxon_end?: DateTime;
}

export interface ProcessedAppointment extends AppointmentType {
  clientName: string;
  day: Date;
  start: Date;
  end: Date;
  luxon_start?: DateTime;
  luxon_end?: DateTime;
  originalAppointment: AppointmentType;
}
