import { DateTime } from 'luxon';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AvailabilitySlot {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  isRecurring?: boolean;
  isAppointment?: boolean;
  clientName?: string;
  appointmentStatus?: string;
  recurrenceRule?: string;
}

export interface WeeklyAvailability {
  monday: AvailabilitySlot[];
  tuesday: AvailabilitySlot[];
  wednesday: AvailabilitySlot[];
  thursday: AvailabilitySlot[];
  friday: AvailabilitySlot[];
  saturday: AvailabilitySlot[];
  sunday: AvailabilitySlot[];
}

export interface AvailabilitySettings {
  id: string;
  clinicianId: string;
  timeZone: string;
  slotDuration: number;
  defaultSlotDuration: number;
  minDaysAhead: number;
  maxDaysAhead: number;
  minNoticeDays: number;
  maxAdvanceDays: number;
  bufferBetweenSlots: number;
  earlyMorningHours: boolean;
  lateEveningHours: boolean;
  weekendAvailability: boolean;
  allowRecurringScheduling: boolean;
  autoConfirm: boolean;
  bookingInstructions?: string;
  timeGranularity?: 'hour' | 'halfhour' | 'quarter';
  createdAt: string;
  updatedAt: string;
}

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timeZone: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export const createEmptyWeeklyAvailability = (): WeeklyAvailability => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
});
