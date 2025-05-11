import { TimeZoneService } from './timeZoneService';
import { DateTime } from 'luxon';

describe('TimeZoneService', () => {
  describe('convertLocalToUTC', () => {
    it('should handle spring forward DST transition (2025-03-09 America/Chicago)', () => {
      const localTime = '2025-03-09T02:30';
      const utcTime = TimeZoneService.convertLocalToUTC(localTime, 'America/Chicago');
      expect(utcTime.toISO()).toBe('2025-03-09T08:30:00.000Z');
    });

    it('should reject fall back DST transition (2025-11-02 America/Chicago)', () => {
      const localTime = '2025-11-02T01:30';
      expect(() => TimeZoneService.convertLocalToUTC(localTime, 'America/Chicago')).toThrow('DateTime falls in DST gap period');
    });

    it('should validate IANA time zone identifiers', () => {
      expect(() => TimeZoneService.ensureIANATimeZone('Invalid/Zone')).toThrow();
      expect(TimeZoneService.ensureIANATimeZone('America/New_York')).toBe('America/New_York');
    });

    it('should handle edge case dates (2000-01-01)', () => {
      const localTime = '2000-01-01T12:00';
      const utcTime = TimeZoneService.convertLocalToUTC(localTime, 'Europe/London');
      expect(utcTime.toISO()).toBe('2000-01-01T12:00:00.000Z');
    });

    it('should reject malformed date inputs', () => {
      expect(() => TimeZoneService.convertLocalToUTC('2025-02-30T12:00', 'America/Chicago')).toThrow('Invalid date-time format');
    });
  });
});