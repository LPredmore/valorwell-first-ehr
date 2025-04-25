
import { WeekdayNumbers } from './calendar';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AvailabilitySlot {
  id: string; // Unique identifier for the slot
  startTime: string; // Format: HH:MM
  endTime: string; // Format: HH:MM
  dayOfWeek: DayOfWeek;
  isRecurring?: boolean;
  isAppointment?: boolean;
  clientName?: string;
  appointmentStatus?: string;
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
  defaultSlotDuration: number;
  minNoticeDays: number;
  maxAdvanceDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientData {
  id: string;
  displayName: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  originalStartTime?: string;
  originalEndTime?: string;
  newStartTime?: string;
  newEndTime?: string;
  isCancelled: boolean;
}

export interface AvailabilityResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AvailabilityEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    isAvailability: boolean;
    isRecurring: boolean;
    recurrenceId?: string;
    dayOfWeek?: DayOfWeek;
  };
}

// Utility to create empty weekly availability
export const createEmptyWeeklyAvailability = (): WeeklyAvailability => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
});
