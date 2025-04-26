
import { WeeklyAvailability, DayOfWeek, AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';

export const createEmptyWeeklyAvailability = (): WeeklyAvailability => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
});

export const getDayNumber = (dayOfWeek: DayOfWeek): number => {
  const days: Record<DayOfWeek, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
  };
  return days[dayOfWeek];
};

// Add missing utility functions
export const convertClinicianDataToAvailabilityBlocks = (availabilityData: any) => {
  return availabilityData.map((slot: any) => ({
    id: slot.id,
    startTime: TimeZoneService.formatTime(slot.startTime, 'TIME_12H'),
    endTime: TimeZoneService.formatTime(slot.endTime, 'TIME_12H'),
    dayOfWeek: slot.dayOfWeek as DayOfWeek
  }));
};

export const getClinicianAvailabilityFieldsQuery = () => `
  id,
  startTime,
  endTime,
  dayOfWeek,
  isRecurring,
  clinicianId
`;
