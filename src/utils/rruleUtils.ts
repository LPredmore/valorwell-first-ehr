
import { format } from 'date-fns';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

interface RRuleOptions {
  freq: Frequency;
  interval?: number;
  byDay?: Weekday[];
  byMonthDay?: number[];
  byMonth?: number[];
  count?: number;
  until?: Date;
  startDate?: Date;
}

/**
 * Generates an iCalendar RRULE string based on the provided options
 * @param options The recurrence rule options
 * @returns RRULE string in iCalendar format
 */
export function generateRRule(options: RRuleOptions): string {
  const parts: string[] = [`FREQ=${options.freq}`];
  
  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }
  
  if (options.byDay && options.byDay.length > 0) {
    parts.push(`BYDAY=${options.byDay.join(',')}`);
  }
  
  if (options.byMonthDay && options.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${options.byMonthDay.join(',')}`);
  }
  
  if (options.byMonth && options.byMonth.length > 0) {
    parts.push(`BYMONTH=${options.byMonth.join(',')}`);
  }
  
  if (options.count) {
    parts.push(`COUNT=${options.count}`);
  }
  
  if (options.until) {
    parts.push(`UNTIL=${format(options.until, 'yyyyMMdd\'T\'HHmmss\'Z\'')}`);
  }
  
  return parts.join(';');
}

/**
 * Creates a weekly recurrence rule for specified days
 * @param days Array of days of the week
 * @param interval Frequency interval (default: 1 = every week)
 * @param until End date (optional)
 * @param count Number of occurrences (optional)
 * @returns RRULE string
 */
export function createWeeklyRule(
  days: Weekday[],
  interval: number = 1,
  until?: Date,
  count?: number
): string {
  return generateRRule({
    freq: 'WEEKLY',
    interval,
    byDay: days,
    until,
    count
  });
}

/**
 * Creates a daily recurrence rule
 * @param interval Frequency interval (default: 1 = every day)
 * @param until End date (optional)
 * @param count Number of occurrences (optional)
 * @returns RRULE string
 */
export function createDailyRule(
  interval: number = 1,
  until?: Date,
  count?: number
): string {
  return generateRRule({
    freq: 'DAILY',
    interval,
    until,
    count
  });
}

/**
 * Creates a monthly recurrence rule by day of month
 * @param dayOfMonth Day of the month (1-31)
 * @param interval Frequency interval (default: 1 = every month)
 * @param until End date (optional)
 * @param count Number of occurrences (optional)
 * @returns RRULE string
 */
export function createMonthlyByDayRule(
  dayOfMonth: number,
  interval: number = 1,
  until?: Date,
  count?: number
): string {
  return generateRRule({
    freq: 'MONTHLY',
    interval,
    byMonthDay: [dayOfMonth],
    until,
    count
  });
}

/**
 * Creates a yearly recurrence rule
 * @param month Month number (1-12)
 * @param dayOfMonth Day of the month (1-31)
 * @param interval Frequency interval (default: 1 = every year)
 * @param until End date (optional)
 * @param count Number of occurrences (optional)
 * @returns RRULE string
 */
export function createYearlyRule(
  month: number,
  dayOfMonth: number,
  interval: number = 1,
  until?: Date,
  count?: number
): string {
  return generateRRule({
    freq: 'YEARLY',
    interval,
    byMonth: [month],
    byMonthDay: [dayOfMonth],
    until,
    count
  });
}

/**
 * Parse an RRULE string into its components
 * @param rrule The RRULE string to parse
 * @returns Object with parsed components
 */
export function parseRRule(rrule: string): Record<string, string> {
  const parts = rrule.split(';');
  const result: Record<string, string> = {};
  
  parts.forEach(part => {
    const [key, value] = part.split('=');
    result[key] = value;
  });
  
  return result;
}

/**
 * Gets day of week as a Weekday code from a date
 * @param date The date to get day code for
 * @returns Weekday code (SU, MO, TU, etc.)
 */
export function getDayCode(date: Date): Weekday {
  const days: Weekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[date.getDay()];
}

/**
 * Converts day number (0-6) to Weekday code
 * @param dayNum Day number (0 for Sunday, 6 for Saturday)
 * @returns Weekday code
 */
export function dayNumberToCode(dayNum: number): Weekday {
  const days: Weekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[dayNum % 7];
}
