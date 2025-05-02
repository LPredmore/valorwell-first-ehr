import { DateTime } from 'luxon';
import { 
  ensureDateTime, 
  toISOString, 
  safeToDateTime, 
  calendarDateToDateTime,
  areDateTimesEqual,
  toAPIDateTime,
  toDisplayDateTime
} from '@/utils/timezone/dateTimeUtils';
import { TimeZoneError } from '@/utils/timezone/TimeZoneError';
import { TimeZoneService } from '@/utils/timezone';

// Mock TimeZoneService for formatting methods
jest.mock('@/utils/timezone', () => ({
  TimeZoneService: {
    formatDate: jest.fn().mockReturnValue('2025-05-01'),
    formatTime: jest.fn().mockReturnValue('2:00 PM'),
    formatDateTime: jest.fn().mockReturnValue('May 1, 2025, 2:00 PM')
  }
}));

describe('DateTime Utility Functions', () => {
  const mockTimeZone = 'America/Chicago';
  const mockDateStr = '2025-05-01T14:00:00';
  const mockDate = new Date('2025-05-01T14:00:00Z');
  const mockDateTime = DateTime.fromISO(mockDateStr, { zone: mockTimeZone });

  describe('ensureDateTime', () => {
    it('should return the input if it is already a DateTime', () => {
      const result = ensureDateTime(mockDateTime, mockTimeZone);
      expect(result).toBe(mockDateTime);
    });

    it('should convert a Date object to DateTime', () => {
      const result = ensureDateTime(mockDate, mockTimeZone);
      expect(result instanceof DateTime).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
    });

    it('should convert an ISO string to DateTime', () => {
      const result = ensureDateTime(mockDateStr, mockTimeZone);
      expect(result instanceof DateTime).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
    });

    it('should try multiple string formats', () => {
      // SQL format
      const sqlDate = '2025-05-01 14:00:00';
      const sqlResult = ensureDateTime(sqlDate, mockTimeZone);
      expect(sqlResult.isValid).toBe(true);
      
      // HTTP format
      const httpDate = 'Thu, 01 May 2025 14:00:00 GMT';
      const httpResult = ensureDateTime(httpDate, mockTimeZone);
      expect(httpResult.isValid).toBe(true);
    });

    it('should throw TimeZoneError for invalid DateTime objects', () => {
      const invalidDateTime = DateTime.fromISO('invalid');
      expect(() => ensureDateTime(invalidDateTime, mockTimeZone)).toThrow(TimeZoneError);
    });

    it('should throw TimeZoneError for unparseable strings', () => {
      expect(() => ensureDateTime('completely invalid date', mockTimeZone)).toThrow(TimeZoneError);
    });

    it('should throw TimeZoneError for unsupported types', () => {
      expect(() => ensureDateTime(123 as any, mockTimeZone)).toThrow(TimeZoneError);
      expect(() => ensureDateTime(null as any, mockTimeZone)).toThrow(TimeZoneError);
      expect(() => ensureDateTime(undefined as any, mockTimeZone)).toThrow(TimeZoneError);
    });
  });

  describe('toISOString', () => {
    it('should convert DateTime to ISO string', () => {
      const result = toISOString(mockDateTime, mockTimeZone);
      expect(typeof result).toBe('string');
      expect(result).toContain('2025-05-01T14:00:00');
    });

    it('should convert Date to ISO string', () => {
      const result = toISOString(mockDate, mockTimeZone);
      expect(typeof result).toBe('string');
      // The exact string will depend on timezone conversion
      expect(result).toContain('2025-05-01');
    });

    it('should convert string to ISO string', () => {
      const result = toISOString(mockDateStr, mockTimeZone);
      expect(typeof result).toBe('string');
      expect(result).toContain('2025-05-01T14:00:00');
    });
  });

  describe('safeToDateTime', () => {
    it('should convert valid inputs to DateTime', () => {
      expect(safeToDateTime(mockDateTime, mockTimeZone)).toBe(mockDateTime);
      expect(safeToDateTime(mockDate, mockTimeZone) instanceof DateTime).toBe(true);
      expect(safeToDateTime(mockDateStr, mockTimeZone) instanceof DateTime).toBe(true);
    });

    it('should return null for invalid inputs', () => {
      expect(safeToDateTime('invalid date', mockTimeZone)).toBeNull();
      expect(safeToDateTime(123 as any, mockTimeZone)).toBeNull();
      expect(safeToDateTime(null as any, mockTimeZone)).toBeNull();
    });
  });

  describe('calendarDateToDateTime', () => {
    it('should convert valid calendar dates to DateTime', () => {
      const result = calendarDateToDateTime(mockDateStr, mockTimeZone);
      expect(result instanceof DateTime).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.zoneName).toBe(mockTimeZone);
    });

    it('should throw TimeZoneError with specific message for invalid inputs', () => {
      try {
        calendarDateToDateTime('invalid date', mockTimeZone);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error instanceof TimeZoneError).toBe(true);
        expect((error as TimeZoneError).message).toContain('Failed to convert calendar date');
      }
    });
  });

  describe('areDateTimesEqual', () => {
    it('should return true for equal DateTimes', () => {
      const dt1 = DateTime.fromISO('2025-05-01T14:00:00', { zone: mockTimeZone });
      const dt2 = DateTime.fromISO('2025-05-01T14:00:00', { zone: mockTimeZone });
      
      expect(areDateTimesEqual(dt1, dt2, mockTimeZone)).toBe(true);
    });

    it('should return true for equal times in different formats', () => {
      const dt1 = DateTime.fromISO('2025-05-01T14:00:00', { zone: mockTimeZone });
      const dateObj = new Date('2025-05-01T14:00:00');
      const dateStr = '2025-05-01T14:00:00';
      
      expect(areDateTimesEqual(dt1, dateObj, mockTimeZone)).toBe(true);
      expect(areDateTimesEqual(dt1, dateStr, mockTimeZone)).toBe(true);
    });

    it('should return false for different DateTimes', () => {
      const dt1 = DateTime.fromISO('2025-05-01T14:00:00', { zone: mockTimeZone });
      const dt2 = DateTime.fromISO('2025-05-01T15:00:00', { zone: mockTimeZone });
      
      expect(areDateTimesEqual(dt1, dt2, mockTimeZone)).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      const dt1 = DateTime.fromISO('2025-05-01T14:00:00', { zone: mockTimeZone });
      
      expect(areDateTimesEqual(dt1, 'invalid date', mockTimeZone)).toBe(false);
      expect(areDateTimesEqual('invalid date', dt1, mockTimeZone)).toBe(false);
    });
  });

  describe('toAPIDateTime', () => {
    it('should convert to UTC ISO string', () => {
      const result = toAPIDateTime(mockDateTime, mockTimeZone);
      
      expect(typeof result).toBe('string');
      expect(result.endsWith('Z')).toBe(true); // UTC marker
    });

    it('should handle different input types', () => {
      const fromDate = toAPIDateTime(mockDate, mockTimeZone);
      const fromString = toAPIDateTime(mockDateStr, mockTimeZone);
      
      expect(typeof fromDate).toBe('string');
      expect(typeof fromString).toBe('string');
      expect(fromDate.endsWith('Z')).toBe(true);
      expect(fromString.endsWith('Z')).toBe(true);
    });
  });

  describe('toDisplayDateTime', () => {
    it('should format datetime for display', () => {
      const result = toDisplayDateTime(mockDateTime, mockTimeZone);
      
      expect(typeof result).toBe('string');
      expect(TimeZoneService.formatDateTime).toHaveBeenCalled();
    });

    it('should format date only', () => {
      const result = toDisplayDateTime(mockDateTime, mockTimeZone, 'date');
      
      expect(typeof result).toBe('string');
      expect(TimeZoneService.formatDate).toHaveBeenCalled();
    });

    it('should format time only', () => {
      const result = toDisplayDateTime(mockDateTime, mockTimeZone, 'time');
      
      expect(typeof result).toBe('string');
      expect(TimeZoneService.formatTime).toHaveBeenCalled();
    });
  });
});