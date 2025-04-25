
import { DateTime } from 'luxon';

export class TimeZoneService {
  /**
   * Safely converts a UTC date/time string to a specific timezone
   */
  static fromUTC(dateTimeStr: string | null | undefined, targetTimeZone: string): DateTime {
    if (!dateTimeStr) {
      console.warn('[TimeZoneService] Received null/undefined datetime:', dateTimeStr);
      return DateTime.local().setZone(targetTimeZone);
    }

    try {
      // Try parsing as SQL timestamp
      const dt = DateTime.fromSQL(dateTimeStr, { zone: 'UTC' });
      if (dt.isValid) {
        return dt.setZone(targetTimeZone);
      }

      // Try parsing as ISO
      const dtIso = DateTime.fromISO(dateTimeStr, { zone: 'UTC' });
      if (dtIso.isValid) {
        return dtIso.setZone(targetTimeZone);
      }

      console.warn('[TimeZoneService] Could not parse datetime:', dateTimeStr);
      return DateTime.local().setZone(targetTimeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting datetime:', error);
      return DateTime.local().setZone(targetTimeZone);
    }
  }

  /**
   * Safely converts a datetime between timezones
   */
  static convertDateTime(
    dateTimeStr: string | null | undefined,
    fromTimeZone: string,
    toTimeZone: string
  ): DateTime {
    if (!dateTimeStr) {
      console.warn('[TimeZoneService] Received null/undefined datetime for conversion');
      return DateTime.local().setZone(toTimeZone);
    }

    try {
      // Try parsing as SQL timestamp first
      const dt = DateTime.fromSQL(dateTimeStr, { zone: fromTimeZone });
      if (dt.isValid) {
        return dt.setZone(toTimeZone);
      }

      // Try parsing as ISO
      const dtIso = DateTime.fromISO(dateTimeStr, { zone: fromTimeZone });
      if (dtIso.isValid) {
        return dtIso.setZone(toTimeZone);
      }

      console.warn('[TimeZoneService] Could not parse datetime:', dateTimeStr);
      return DateTime.local().setZone(toTimeZone);
    } catch (error) {
      console.error('[TimeZoneService] Error converting between timezones:', error);
      return DateTime.local().setZone(toTimeZone);
    }
  }

  /**
   * Ensures we have a valid IANA timezone string
   */
  static ensureIANATimeZone(timeZone: string | null | undefined): string {
    if (!timeZone) {
      console.warn('[TimeZoneService] No timezone provided, defaulting to UTC');
      return 'UTC';
    }

    try {
      // Test if the timezone is valid
      const dt = DateTime.local().setZone(timeZone);
      if (dt.isValid) {
        return timeZone;
      }
      console.warn('[TimeZoneService] Invalid timezone:', timeZone);
      return 'UTC';
    } catch (error) {
      console.error('[TimeZoneService] Error validating timezone:', error);
      return 'UTC';
    }
  }
}
