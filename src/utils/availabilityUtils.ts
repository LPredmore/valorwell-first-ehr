
import { WeeklyAvailability, DayOfWeek } from '@/types/availability';

export const createEmptyWeeklyAvailability = (): WeeklyAvailability => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
});
