import { DateTime } from 'luxon';
import { AvailabilitySlot as CoreAvailabilitySlot } from '@/types/appointment';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Re-export the core AvailabilitySlot type but extend it with our specific needs
export interface AvailabilitySlot extends CoreAvailabilitySlot {
  dayOfWeek: DayOfWeek; // Override to be more specific
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
