
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

describe('TimeZoneService', () => {
  const mockTimeZone = 'America/Chicago';
  const mockDateTime = DateTime.fromISO('2025-05-01T12:00:00', { zone: mockTimeZone });

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

    it('formatDate should format a date correctly', () => {
      const date = new Date('2025-05-01T14:30:00');
      const result = TimeZoneService.formatDate(date, 'yyyy/MM/dd');
      
      expect(result).toBe('2025/05/01');
    });
    
    it('formatTime should format a time correctly', () => {
      const time = new Date('2025-05-01T14:30:00');
      const result = TimeZoneService.formatTime(time, 'h:mm a');
      
      expect(result).toMatch(/2:30 PM/i); // Case-insensitive match for AM/PM variations
    });
    
    it('addDuration should add time correctly', () => {
      const date = DateTime.fromISO('2025-05-01T12:00:00');
      
      const result = TimeZoneService.addDuration(date, 2, 'hours');
      expect(result.hour).toBe(14);
    });
    
    it('isSameDay should compare dates correctly', () => {
      const date1 = new Date('2025-05-01T09:00:00');
      const date2 = new Date('2025-05-01T17:00:00');
      const date3 = new Date('2025-05-02T09:00:00');
      
      expect(TimeZoneService.isSameDay(date1, date2)).toBe(true);
      expect(TimeZoneService.isSameDay(date1, date3)).toBe(false);
    });
    
    it('parseWithZone should parse date with timezone correctly', () => {
      const dateStr = '2025-05-01T12:00:00';
      const result = TimeZoneService.parseWithZone(dateStr, mockTimeZone);
      
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
    });
    
    it('getCurrentDateTime should return current time in specified timezone', () => {
      const result = TimeZoneService.getCurrentDateTime(mockTimeZone);
      
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
    });
    
    it('getWeekdayName should return correct day name', () => {
      // May 1, 2025 is a Thursday
      const date = new Date('2025-05-01T12:00:00');
      const result = TimeZoneService.getWeekdayName(date);
      
      expect(result).toBe('Thursday');
    });
    
    it('getMonthName should return correct month name', () => {
      const date = new Date('2025-05-01T12:00:00');
      const result = TimeZoneService.getMonthName(date);
      
      expect(result).toBe('May');
    });
  });
});
