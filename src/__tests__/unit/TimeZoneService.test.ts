import { TimeZoneService } from '@/services/calendar/TimeZoneService';
import { DateTime } from 'luxon';

describe('TimeZoneService', () => {
  const mockTimeZone = 'America/Chicago';
  const mockDateTime = DateTime.fromISO('2025-05-01T12:00:00', { zone: mockTimeZone });

  describe('Backward Compatibility Methods', () => {
    it('validateTimeZone should call ensureIANATimeZone', () => {
      // Spy on the ensureIANATimeZone method
      const spy = jest.spyOn(TimeZoneService, 'ensureIANATimeZone');
      
      // Call the deprecated method
      const result = TimeZoneService.validateTimeZone(mockTimeZone);
      
      // Verify it calls the new method
      expect(spy).toHaveBeenCalledWith(mockTimeZone);
      expect(result).toBe(mockTimeZone);
      
      // Restore the spy
      spy.mockRestore();
    });

    it('convertTimeZone should call convertDateTime', () => {
      // Spy on the convertDateTime method
      const spy = jest.spyOn(TimeZoneService, 'convertDateTime');
      const targetTimeZone = 'America/New_York';
      
      // Call the deprecated method
      TimeZoneService.convertTimeZone(mockDateTime, mockTimeZone, targetTimeZone);
      
      // Verify it calls the new method
      expect(spy).toHaveBeenCalledWith(mockDateTime, mockTimeZone, targetTimeZone);
      
      // Restore the spy
      spy.mockRestore();
    });
  });

  describe('Core Timezone Methods', () => {
    it('ensureIANATimeZone should validate and return a timezone', () => {
      // Valid timezone
      expect(TimeZoneService.ensureIANATimeZone(mockTimeZone)).toBe(mockTimeZone);
      
      // Default timezone when none provided
      expect(TimeZoneService.ensureIANATimeZone()).toBe('America/Chicago');
      
      // Invalid timezone should return default
      expect(TimeZoneService.ensureIANATimeZone('Invalid/Timezone')).toBe('America/Chicago');
    });

    it('createDateTime should create a valid DateTime object', () => {
      const date = '2025-05-01';
      const time = '14:30';
      
      const result = TimeZoneService.createDateTime(date, time, mockTimeZone);
      
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(30);
    });

    it('getCurrentDateTime should return current time in specified timezone', () => {
      const now = TimeZoneService.getCurrentDateTime(mockTimeZone);
      
      expect(now.isValid).toBe(true);
      expect(now.zoneName).toBe(mockTimeZone);
    });

    it('fromUTC should convert UTC string to local timezone', () => {
      const utcString = '2025-05-01T17:00:00Z';
      const result = TimeZoneService.fromUTC(utcString, mockTimeZone);
      
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
      // Chicago is UTC-5 or UTC-6 depending on DST
      expect(result.hour).toBeLessThan(17);
    });
  });

  describe('Formatting Methods', () => {
    it('formatDateTime should format a DateTime correctly', () => {
      const date = DateTime.fromISO('2025-05-01T14:30:00', { zone: mockTimeZone });
      
      // Default format
      const defaultFormat = TimeZoneService.formatDateTime(date);
      expect(defaultFormat).toContain('2025-05-01');
      expect(defaultFormat).toContain('14:30');
      
      // Custom format
      const customFormat = TimeZoneService.formatDateTime(date, 'yyyy/MM/dd');
      expect(customFormat).toBe('2025/05/01');
      
      // Predefined format
      const fullFormat = TimeZoneService.formatDateTime(date, 'full');
      expect(fullFormat).toContain('2025');
      expect(fullFormat).toContain('May');
    });

    it('formatTimeZoneDisplay should create a user-friendly timezone string', () => {
      const display = TimeZoneService.formatTimeZoneDisplay(mockTimeZone);
      
      expect(display).toContain(mockTimeZone);
      expect(display).toContain('CDT'); // or CST depending on time of year
    });
  });

  describe('Utility Methods', () => {
    it('isSameDay should correctly compare dates', () => {
      const date1 = DateTime.fromISO('2025-05-01T09:00:00', { zone: mockTimeZone });
      const date2 = DateTime.fromISO('2025-05-01T17:00:00', { zone: mockTimeZone });
      const date3 = DateTime.fromISO('2025-05-02T09:00:00', { zone: mockTimeZone });
      
      expect(TimeZoneService.isSameDay(date1, date2)).toBe(true);
      expect(TimeZoneService.isSameDay(date1, date3)).toBe(false);
    });

    it('addDuration should add time correctly', () => {
      const date = DateTime.fromISO('2025-05-01T12:00:00', { zone: mockTimeZone });
      
      const plusHours = TimeZoneService.addDuration(date, 2, 'hours');
      expect(plusHours.hour).toBe(14);
      
      const plusDays = TimeZoneService.addDuration(date, 1, 'days');
      expect(plusDays.day).toBe(2);
    });

    it('convertEventToUserTimeZone should convert calendar events', () => {
      const event = {
        id: '123',
        title: 'Test Event',
        start: '2025-05-01T12:00:00Z',
        end: '2025-05-01T13:00:00Z',
        extendedProps: {
          timezone: 'UTC'
        }
      };
      
      const result = TimeZoneService.convertEventToUserTimeZone(event, mockTimeZone);
      
      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Event');
      expect(result.extendedProps?.timezone).toBe(mockTimeZone);
      // The times should be converted to the user's timezone
      expect(result.start).not.toBe(event.start);
      expect(result.end).not.toBe(event.end);
    });
  });
});