
export interface AppointmentType {
  id: string;
  client_id: string;
  clinician_id: string;
  status: string;
  type: string;
  notes?: string;
  video_room_url?: string;
  recurring_group_id?: string;
  appointment_recurring?: string;
  // ISO timestamp fields
  start_at: string;
  end_at: string;
  // Client information from join
  clients?: {
    client_first_name: string;
    client_last_name: string;
  };
  // Display fields for timezone conversions (not in DB, added at runtime)
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
  // Add clientName convenience property
  clientName?: string;
}

export type Appointment = AppointmentType;

export interface AppointmentWithLuxon extends AppointmentType {
  // Add Luxon-specific fields
  _luxon_start?: any;
  _luxon_end?: any;
}

export type BaseAppointment = AppointmentType;

export interface AvailabilitySettings {
  id: string;
  clinician_id?: string;
  timezone: string;
  default_slot_duration?: number;
  min_notice_hours?: number;
  max_advance_days?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface AvailabilitySlot {
  id?: string;
  start_at: string;
  end_at: string;
  is_recurring?: boolean;
  excludeDates?: string[];
  title?: string; // Added title property for compatibility
}

export interface WeeklyAvailability {
  [key: string]: AvailabilitySlot[];
}

export interface CalculatedAvailableSlot {
  start: string;
  end: string;
  slotId?: string;
  isRecurring?: boolean;
}
