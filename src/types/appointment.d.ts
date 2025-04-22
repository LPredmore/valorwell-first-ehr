
export interface AppointmentType {
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
  source_time_zone: string;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
  // Add display fields for timezone conversions
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
  video_room_url?: string;
}

export interface AppointmentWithLuxon extends AppointmentType {
  start_time: string;
  end_time: string;
  // Add Luxon-specific fields
  _luxon_start?: any;
  _luxon_end?: any;
}

export type BaseAppointment = AppointmentType;
