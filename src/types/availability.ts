
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
  timeGranularity: 'hour' | 'halfhour';
  isActive?: boolean;
}

export interface WeeklyAvailability {
  [key in DayOfWeek]: AvailabilitySlot[];
}

