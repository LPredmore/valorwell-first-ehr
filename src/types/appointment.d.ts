
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
  // Use Luxon-standard ISO timestamp fields
  start_at: string;
  end_at: string;
  // Client information from join
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
  // Display fields for timezone conversions
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
  clinicianId: string;
  timezone: string;
  defaultSlotDuration: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  createdAt: string;
  updatedAt: string;
  is_active?: boolean;
}

export interface AvailabilitySlot {
  id?: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  isRecurring?: boolean;
  excludeDates?: string[];
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
