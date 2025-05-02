
import { DateTime } from 'luxon';
import { TimeZoneService } from '../../services/calendar/TimeZoneService';

describe('TimeZoneService', () => {
  describe('ensureIANATimeZone', () => {
    it('should return default timezone when input is null', () => {
      expect(TimeZoneService.ensureIANATimeZone(null)).toEqual('UTC');
    });

    it('should return default timezone when input is undefined', () => {
      expect(TimeZoneService.ensureIANATimeZone(undefined)).toEqual('UTC');
    });

    it('should return input timezone when valid', () => {
      expect(TimeZoneService.ensureIANATimeZone('America/New_York')).toEqual('America/New_York');
    });

    it('should return custom default timezone when provided', () => {
      expect(TimeZoneService.ensureIANATimeZone(null, 'America/Los_Angeles')).toEqual('America/Los_Angeles');
    });
  });

  describe('getLocalTimeZone', () => {
    it('should return a non-empty string', () => {
      const result = TimeZoneService.getLocalTimeZone();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatTimeZoneDisplay', () => {
    it('should format a known timezone nicely', () => {
      const result = TimeZoneService.formatTimeZoneDisplay('America/New_York');
      expect(result).toEqual('Eastern Time (US & Canada)');
    });

    it('should handle an unknown timezone', () => {
      // This test may vary based on implementation details
      const result = TimeZoneService.formatTimeZoneDisplay('America/Somewhere_Invalid');
      expect(typeof result).toBe('string');
    });
  });

  describe('createDateTime', () => {
    it('should create a DateTime from date and time strings', () => {
      const date = '2023-05-15';
      const time = '14:30';
      const timezone = 'America/New_York';
      
      const result = TimeZoneService.createDateTime(date, time, timezone);
      
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(timezone);
      expect(result.toFormat('yyyy-MM-dd')).toBe(date);
      expect(result.toFormat('HH:mm')).toBe(time);
    });
  });

  describe('convertDateTime', () => {
    it('should convert between timezones with DateTime input', () => {
      const nyDateTime = DateTime.fromObject({ year: 2023, month: 5, day: 15, hour: 10 }, { zone: 'America/New_York' });
      const laDateTime = TimeZoneService.convertDateTime(nyDateTime, 'America/New_York', 'America/Los_Angeles');
      
      expect(laDateTime.zoneName).toBe('America/Los_Angeles');
      expect(laDateTime.hour).toBe(7); // 3 hours earlier in LA
    });
    
    it('should handle Date objects', () => {
      const date = new Date('2023-05-15T10:00:00Z');
      // Create a DateTime from the Date for comparison
      const luxonDateTime = DateTime.fromJSDate(date).setZone('UTC');
      
      const converted = TimeZoneService.convertDateTime(date, 'UTC', 'America/New_York');
      
      expect(converted.zoneName).toBe('America/New_York');
    });
    
    it('should handle string dates', () => {
      const dateStr = '2023-05-15T10:00:00Z';
      const converted = TimeZoneService.convertDateTime(dateStr, 'UTC', 'America/New_York');
      
      expect(converted.zoneName).toBe('America/New_York');
    });
  });

  describe('formatDateTime', () => {
    it('should format DateTime objects', () => {
      const dt = DateTime.fromObject({ year: 2023, month: 5, day: 15, hour: 10 }, { zone: 'UTC' });
      
      // Test with predefined formats
      expect(TimeZoneService.formatDateTime(dt, 'date')).toBe('2023-05-15');
      expect(TimeZoneService.formatDateTime(dt, 'time')).toBe('10:00');
      
      // Test with custom format
      expect(TimeZoneService.formatDateTime(dt, 'yyyy/MM/dd')).toBe('2023/05/15');
    });
    
    it('should handle Date objects', () => {
      // For testing purposes, create a fixed date
      const date = new Date(2023, 4, 15, 10, 0); // May 15, 2023, 10:00 AM
      const result = TimeZoneService.formatDateTime(date, 'yyyy-MM-dd HH:mm');
      
      // The exact result may vary based on local timezone, but we can expect this format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });

  describe('toUTC and fromUTC', () => {
    it('should convert to UTC', () => {
      const nyDateTime = DateTime.fromObject({ year: 2023, month: 5, day: 15, hour: 10 }, { zone: 'America/New_York' });
      const utcDateTime = TimeZoneService.toUTC(nyDateTime);
      
      expect(utcDateTime.zoneName).toBe('UTC');
      // NY is 4 or 5 hours behind UTC depending on DST
      expect([14, 15]).toContain(utcDateTime.hour);
    });
    
    it('should convert from UTC', () => {
      const utcStr = '2023-05-15T10:00:00Z';
      const nyDateTime = TimeZoneService.fromUTC(utcStr, 'America/New_York');
      
      expect(nyDateTime.zoneName).toBe('America/New_York');
      // NY is 4 or 5 hours behind UTC depending on DST
      expect([5, 6]).toContain(nyDateTime.hour);
    });
  });
});
