/**
 * Base interface for appointment data
 */
export interface BaseAppointment {
  id: string;
  client_id: string;
  clinician_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  appointment_datetime?: string; // UTC timestamp
  appointment_end_datetime?: string; // UTC timestamp
  source_time_zone?: string; // Time zone in which the appointment was created
  video_room_url?: string | null;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
  clientName?: string; // For EditAppointmentDialog and display purposes
  notes?: string;
  display_date?: string; // Date converted to user's time zone
  display_start_time?: string; // Start time converted to user's time zone
  display_end_time?: string; // End time converted to user's time zone
}

// For backward compatibility
export type Appointment = BaseAppointment;

/**
 * Canonical AppointmentType that should be used across the application
 * This ensures consistency in appointment type definitions
 */
export type AppointmentType = BaseAppointment;

/**
 * For components that need processed appointments
 */
export interface ProcessedAppointment {
  id: string;
  start: Date;
  end: Date;
  title: string;
  clientName: string;
  status: string;
}
