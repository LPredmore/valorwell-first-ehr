
/**
 * @deprecated Use the new modular TimeZoneService from @/utils/timezone instead
 * This file is maintained for backward compatibility with existing code
 */

import { TimeZoneService } from '@/utils/timezone';
import type { TimeUnit, DateTimeFormat } from '@/utils/timezone';

// Re-export the essential Luxon-related utilities from TimeZoneService
export const {
  createDateTime,
  parseWithZone,
  convertDateTime,
  formatDateTime,
  formatTime,
  addDuration,
  isSameDay,
  toUTC,
  fromUTC,
  toUTCTimestamp,
  fromUTCTimestamp,
  getCurrentDateTime,
  formatDateToTime12Hour
} = TimeZoneService;

// Export type aliases for common DateTime operations if needed
export type { TimeUnit, DateTimeFormat };
