
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
