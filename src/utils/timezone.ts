
/**
 * Main TimeZoneService export file
 * This file re-exports the TimeZoneService implementation for use throughout the application
 */

import { TimeZoneService } from '../services/calendar/TimeZoneService';

// Export the TimeZoneService class for use throughout the application
export { TimeZoneService };

// Export common types
export type TimeUnit = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
export type DateTimeFormat = 'full' | 'date' | 'time' | string;

// Re-export default for backwards compatibility
export default TimeZoneService;
