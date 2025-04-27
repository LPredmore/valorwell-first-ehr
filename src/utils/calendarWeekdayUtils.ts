
import { DayOfWeek } from '@/types/availability';
import { WeekdayNumbers } from '@/types/calendar';

/**
 * Map day names to their corresponding numbers
 */
export const weekdayNameToNumber: Record<DayOfWeek, WeekdayNumbers> = {
  monday: 1 as WeekdayNumbers,
  tuesday: 2 as WeekdayNumbers,
  wednesday: 3 as WeekdayNumbers,
  thursday: 4 as WeekdayNumbers,
  friday: 5 as WeekdayNumbers,
  saturday: 6 as WeekdayNumbers,
  sunday: 0 as WeekdayNumbers
};

/**
 * Map day numbers to their corresponding names
 */
export const weekdayNumberToName: Record<WeekdayNumbers, DayOfWeek> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  0: 'sunday'
};

/**
 * Get the weekday name from a date string
 */
export const getWeekdayFromDate = (date: Date | string): DayOfWeek => {
  const day = typeof date === 'string' ? new Date(date) : date;
  const dayNumber = day.getDay() as WeekdayNumbers;
  return weekdayNumberToName[dayNumber];
};
