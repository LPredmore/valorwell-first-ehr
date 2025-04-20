
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
  
  // Display fields for time zone conversion
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
  
  // Client information used in AppointmentCard and other components
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
  clientName?: string; // For display purposes
}

export interface AppointmentWithLuxon extends BaseAppointment {
  _luxon_start?: DateTime;
  _luxon_end?: DateTime;
}

// Canonical type to use throughout the application
export type AppointmentType = AppointmentWithLuxon;

// Simple Appointment type that many components import
export type Appointment = BaseAppointment;

export interface ProcessedAppointment extends AppointmentType {
  clientName: string;
  day: Date;
  start: Date;
  end: Date;
  luxon_start?: DateTime;
  luxon_end?: DateTime;
  originalAppointment: AppointmentType;
}
