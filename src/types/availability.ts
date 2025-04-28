
import { DateTime } from 'luxon';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AvailabilitySlot {
  id?: string;
  clinicianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  timeZone?: string;
  isActive?: boolean;
  // Add these properties to resolve previous build errors
  isAppointment?: boolean;
  clientName?: string;
  appointmentStatus?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
}

export interface AvailabilitySettings {
  id?: string;
  clinicianId: string;
  defaultSlotDuration: number;
  minNoticeDays: number;
  maxAdvanceDays: number;
  timeZone: string;
  slotDuration: number;
  timeGranularity: 'hour' | 'halfhour' | 'quarter';
  isActive?: boolean;
}

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timeZone: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export type WeeklyAvailability = {
  [key in DayOfWeek]: AvailabilitySlot[];
};

// Define the type for availability events from the database
export interface AvailabilityEvent {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  availability_type: string;
  is_active: boolean;
  recurrence_rule?: string;
  event_type: string;
  client_name?: string;
  status?: string;
}
