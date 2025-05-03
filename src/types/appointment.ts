
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
  
  // Legacy snake_case properties to maintain compatibility
  client_id?: string;
  clinician_id?: string; 
  start_time?: string;
  end_time?: string;
  appointment_datetime?: string;
  appointment_end_datetime?: string;
  source_time_zone?: string;
  
  // Display properties for timezone conversions
  display_date?: string;
  display_start_time?: string;
  display_end_time?: string;
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
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
}

/**
 * Type aliases to maintain backward compatibility with existing code
 */
export type Appointment = AppointmentDetail;
export type AppointmentType = AppointmentDetail;

/**
 * Extended appointment type with Luxon DateTime objects
 */
export interface AppointmentWithLuxon extends AppointmentDetail {
  _luxon_start?: any;
  _luxon_end?: any;
}

/**
 * Type guard to check if an object is a BaseAppointment
 */
export function isBaseAppointment(obj: any): obj is BaseAppointment {
  return obj && 
    typeof obj.id === 'string' && 
    (typeof obj.clientName === 'string' || typeof obj.client_id === 'string') && 
    ((typeof obj.startTime === 'string') || (typeof obj.start_time === 'string')) && 
    ((typeof obj.endTime === 'string') || (typeof obj.end_time === 'string'));
}

/**
 * Helper function to standardize appointment property access
 * This handles both camelCase and snake_case variants
 */
export function getAppointmentProperty<K extends keyof BaseAppointment>(
  appointment: BaseAppointment, 
  property: K
): BaseAppointment[K] {
  return appointment[property];
}

/**
 * Calendar availability interfaces
 */
export interface AvailabilitySlot {
  id?: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  clinicianId: string;
  isRecurring?: boolean;
  isAppointment?: boolean;
  clientName?: string;
  appointmentStatus?: string;
  excludeDates?: string[];
  timezone?: string; // Add this missing property
  specificDate?: string; // Add this missing property
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

export interface AvailabilityEvent {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  time_zone?: string;
  dayOfWeek?: string; 
  isRecurring?: boolean;
  excludeDates?: string[];
}

// Define AppointmentAvailabilitySlot type that was being used in AvailabilityQueryService
export type AppointmentAvailabilitySlot = AvailabilitySlot;
