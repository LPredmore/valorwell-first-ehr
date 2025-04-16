
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
  video_room_url?: string | null;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
  clientName?: string; // For EditAppointmentDialog and display purposes
  notes?: string;
}

// For backward compatibility
export type Appointment = BaseAppointment;

// For components that need processed appointments
export interface ProcessedAppointment {
  id: string;
  start: Date;
  end: Date;
  title: string;
  clientName: string;
  status: string;
}
