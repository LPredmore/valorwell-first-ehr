
/**
 * Availability settings interface
 */
export interface AvailabilitySettings {
  id?: string;
  clinicianId: string;
  defaultSlotDuration: number;
  slotDuration: number;
  minNoticeDays: number;
  maxAdvanceDays: number;
  timeZone: string;
  timeGranularity: 'hour' | 'halfhour' | 'quarter';
  isActive?: boolean;
}

/**
 * Day of week type
 */
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/**
 * Availability slot interface
 */
export interface AvailabilitySlot {
  id?: string;
  clinicianId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  isRecurring?: boolean;
  timezone?: string;
  specificDate?: string;
  title?: string;
  allDay?: boolean;
}

/**
 * Weekly availability interface
 */
export interface WeeklyAvailability {
  [key in DayOfWeek]: AvailabilitySlot[];
}

/**
 * Available time slot interface
 */
export interface AvailableTimeSlot {
  start: string;
  end: string;
  slotId?: string;
  isRecurring?: boolean;
}
