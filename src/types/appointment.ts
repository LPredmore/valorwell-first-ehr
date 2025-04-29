
/**
 * Base appointment interface used across the application
 */
export interface BaseAppointment {
  id: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  clientId: string;
}

/**
 * Extended appointment interface for API responses
 */
export interface AppointmentDetail extends BaseAppointment {
  clinician_id: string;
  appointment_datetime?: string;
  appointment_end_datetime?: string;
  type?: string;
  notes?: string;
  video_room_url?: string;
  recurring_group_id?: string;
  appointment_recurring?: string;
  source_time_zone?: string;
}

/**
 * Type aliases to maintain backward compatibility with existing code
 */
export type Appointment = AppointmentDetail;
export type AppointmentType = AppointmentDetail;

/**
 * Extended appointment type with Luxon DateTime objects
 */
export interface AppointmentWithLuxon extends AppointmentType {
  _luxon_start?: any;
  _luxon_end?: any;
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
}

/**
 * Type guard to check if an object is a BaseAppointment
 */
export function isBaseAppointment(obj: any): obj is BaseAppointment {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.clientName === 'string' && 
    typeof obj.startTime === 'string' && 
    typeof obj.endTime === 'string';
}
