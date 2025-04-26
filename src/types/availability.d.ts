import { DateTime } from 'luxon';

export type TimeSlot = {
  start: string;
  end: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
};

export type AvailabilitySettings = {
  clinicianId: string;
  defaultSlotDuration: number;
  minNoticeDays: number;
  maxAdvanceDays: number;
  timeZone: string;
  slotDuration: number;
  timeGranularity: 'hour' | 'halfhour';
  isActive?: boolean;
};

export type AvailabilitySlot = {
  id?: string;
  clinicianId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurrenceRule?: string;
  isRecurring?: boolean;
  timeZone?: string;
};

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type WeeklyAvailability = {
  [key in DayOfWeek]: AvailabilitySlot[];
};
