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
  _luxon_start?: DateTime;
  _luxon_end?: DateTime;
  client_name?: string;
  clinician_name?: string;
}

export interface AppointmentType extends BaseAppointment {
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
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

export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  classNames?: string[];
  extendedProps?: {
    clientId?: string;
    clientName?: string;
    clinicianId?: string;
    clinicianName?: string;
    appointmentType?: string;
    status?: string;
    notes?: string;
    originalAppointment?: AppointmentType;
  };
}

export interface FullCalendarAvailabilityEvent extends FullCalendarEvent {
  rendering?: 'background';
  display?: 'background';
  extendedProps: {
    isAvailability: true;
    availabilityId: string;
  };
}
