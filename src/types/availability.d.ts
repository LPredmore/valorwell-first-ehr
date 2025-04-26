
export interface AvailabilitySlot {
  id?: string;
  clinicianId: string;
  startTime: string;
  endTime: string;
  availabilityType: 'single' | 'recurring';
  title?: string;
  isActive?: boolean;
  recurrenceRule?: string;
  timezone?: string;
}

export interface AvailabilitySettings {
  minNoticeDays: number;
  maxAdvanceDays: number;
  defaultSlotDuration: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeeklyAvailability {
  monday: Array<WeeklyAvailabilitySlot>;
  tuesday: Array<WeeklyAvailabilitySlot>;
  wednesday: Array<WeeklyAvailabilitySlot>;
  thursday: Array<WeeklyAvailabilitySlot>;
  friday: Array<WeeklyAvailabilitySlot>;
  saturday: Array<WeeklyAvailabilitySlot>;
  sunday: Array<WeeklyAvailabilitySlot>;
}

export interface WeeklyAvailabilitySlot {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  isRecurring?: boolean;
  isAppointment?: boolean;
  clientName?: string;
  appointmentStatus?: string;
}
