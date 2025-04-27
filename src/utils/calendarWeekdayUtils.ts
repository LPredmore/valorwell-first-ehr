
import { DayOfWeek } from '@/types/availability';

/**
 * Map day names to their corresponding numbers
 */
export const weekdayNameToNumber: Record<DayOfWeek, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0
};

/**
 * Map day numbers to their corresponding names
 */
export const weekdayNumberToName: Record<number, DayOfWeek> = {
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
  const dayNumber = day.getDay();
  return weekdayNumberToName[dayNumber];
};
