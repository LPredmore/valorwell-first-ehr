
export interface AvailabilitySlot {
  id?: string;
  clinicianId: string;
  startTime: string;
  endTime: string;
  availabilityType: 'single' | 'recurring';
  title?: string;
  isActive?: boolean;
  recurrenceRule?: string;
}

export interface AvailabilitySettings {
  minNoticeDays: number;
  maxAdvanceDays: number;
  defaultSlotDuration: number;
}
