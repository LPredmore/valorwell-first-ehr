
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
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
  video_room_url?: string;
  recurring_group_id?: string;
  appointment_recurring?: string;
  clientName?: string;
}

export interface AppointmentWithLuxon extends AppointmentType {
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

export interface CalculatedAvailableSlot {
  start: string;
  end: string;
  slotId?: string;
  isRecurring?: boolean;
}
