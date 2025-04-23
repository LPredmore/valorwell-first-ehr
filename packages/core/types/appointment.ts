
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
  // Add recurring appointment fields
  recurring_group_id?: string;
  appointment_recurring?: string;
  // Add clientName convenience property
  clientName?: string;
}

export type Appointment = AppointmentType;

export interface AppointmentWithLuxon extends AppointmentType {
  start_time: string;
  end_time: string;
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

// Add: Slot calculation result interface
export interface CalculatedAvailableSlot {
  start: string;       // ISO date-time of slot start (in clinician's tz)
  end: string;         // ISO date-time of slot end (in clinician's tz)
  slotId?: string;
  isRecurring?: boolean;
}
