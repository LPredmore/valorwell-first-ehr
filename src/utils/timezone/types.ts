
/**
 * Type definitions for the timezone utilities
 */

/**
 * Time unit type for duration calculations
 */
export type TimeUnit = 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

/**
 * DateTime format options
 */
export type DateTimeFormat = string;

/**
 * Calendar event types
 */
export type CalendarEventType = 'appointment' | 'availability' | 'time_off';

/**
 * Common timezone interface types
 */
export interface TimeZoneOption {
  value: string;
  label: string;
}

/**
 * Event conversion result
 */
export interface ConversionResult {
  success: boolean;
  event?: any;
  error?: string;
}

/**
 * Interface for calendar events
 */
export interface CalendarEventBase {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  extendedProps?: Record<string, any>;
}
