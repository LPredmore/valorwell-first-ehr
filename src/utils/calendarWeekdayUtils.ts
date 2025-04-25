
import { WeekdayNumbers } from '@/types/calendar';
import { DateTime } from 'luxon';

/**
 * Utility for safely converting between Luxon weekday numbers and our application's WeekdayNumbers type
 * Luxon uses 1-7 (Monday=1, Sunday=7) while our application uses 0-6 (Sunday=0, Saturday=6)
 */
export const convertLuxonWeekdayToCalendarWeekday = (luxonWeekday: number): WeekdayNumbers => {
  // Convert Luxon's 1-7 format (Monday=1, Sunday=7) to our 0-6 format (Sunday=0, Saturday=6)
  // This handles the special case for Sunday (7 in Luxon to 0 in our format)
  if (luxonWeekday === 7) return 0 as WeekdayNumbers;
  return luxonWeekday as WeekdayNumbers;
};

/**
 * Map day name strings to our application's WeekdayNumbers
 */
export const weekdayNameToNumber: { [key: string]: WeekdayNumbers } = {
  sunday: 0 as WeekdayNumbers,
  monday: 1 as WeekdayNumbers,
  tuesday: 2 as WeekdayNumbers,
  wednesday: 3 as WeekdayNumbers,
  thursday: 4 as WeekdayNumbers,
  friday: 5 as WeekdayNumbers,
  saturday: 6 as WeekdayNumbers
};

/**
 * Get weekday number from a DateTime object using our application's WeekdayNumbers format
 */
export const getWeekdayNumberFromDateTime = (dateTime: DateTime): WeekdayNumbers => {
  // Luxon's weekday is 1-7 (Monday=1, Sunday=7)
  // We need to convert to 0-6 (Sunday=0, Saturday=6)
  return convertLuxonWeekdayToCalendarWeekday(dateTime.weekday);
};

/**
 * Get the day name from a weekday number
 */
export const getWeekdayNameFromNumber = (weekdayNumber: WeekdayNumbers): string => {
  const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return weekdayNames[weekdayNumber];
};
