
export interface AvailabilitySettings {
  id: string;
  clinicianId: string;
  defaultSlotDuration: number;
  minNoticeDays: number;
  maxAdvanceDays: number;
  createdAt?: string;
  updatedAt?: string;
}
