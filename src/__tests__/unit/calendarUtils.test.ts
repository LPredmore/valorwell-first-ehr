import { DateTime } from 'luxon';
import { TimeZoneService } from '../../services/calendar/TimeZoneService';
import { CalendarError } from '../../services/calendar/CalendarErrorHandler';

// Mock the core TimeZoneService
jest.mock('@/utils/timezone', () => ({
  TimeZoneService: {
    ensureIANATimeZone: jest.fn((tz) => {
      if (tz === 'Invalid/TimeZone') {
        throw new Error('Invalid timezone');
      }
      return tz;
    })
  }
}));

// Mock the TimeZoneError
jest.mock('@/utils/timezone/TimeZoneError', () => ({
  TimeZoneError: class TimeZoneError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'TimeZoneError';
    }
  }
}));

/**
 * Utility functions for testing date and time operations
 */
const testUtils = {
  /**
   * Creates a DateTime object for testing
   */
  createTestDateTime(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timeZone: string
  ): DateTime {
    return DateTime.fromObject(
      {
        year,
        month,
        day,
        hour,
        minute
      },
      {
        zone: timeZone
      }
    );
  },

  /**
   * Checks if two dates are equal (ignoring milliseconds)
   */
  areDatesEqual(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate() &&
      date1.getHours() === date2.getHours() &&
      date1.getMinutes() === date2.getMinutes() &&
      date1.getSeconds() === date2.getSeconds()
    );
  },

  /**
   * Checks if a date is within a range
   */
  isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  },

  /**
   * Checks if two date ranges overlap
   */
  doRangesOverlap(
    range1Start: Date,
    range1End: Date,
    range2Start: Date,
    range2End: Date
  ): boolean {
    return range1Start < range2End && range1End > range2Start;
  }
};

describe('Calendar Utility Functions', () => {
  describe('createTestDateTime', () => {
    it('should create a DateTime object with the specified values', () => {
      const dateTime = testUtils.createTestDateTime(
        2025,
        5,
        1,
        10,
        30,
        'America/New_York'
      );

      expect(dateTime.year).toBe(2025);
      expect(dateTime.month).toBe(5);
      expect(dateTime.day).toBe(1);
      expect(dateTime.hour).toBe(10);
      expect(dateTime.minute).toBe(30);
      expect(dateTime.zoneName).toBe('America/New_York');
    });

    it('should handle different time zones', () => {
      const nyDateTime = testUtils.createTestDateTime(
        2025,
        5,
        1,
        10,
        30,
        'America/New_York'
      );
      const laDateTime = testUtils.createTestDateTime(
        2025,
        5,
        1,
        7,
        30,
        'America/Los_Angeles'
      );

      // Convert both to UTC for comparison
      const nyUtc = nyDateTime.toUTC();
      const laUtc = laDateTime.toUTC();

      // They should be approximately the same time
      expect(nyUtc.hour).toBe(laUtc.hour);
      expect(nyUtc.minute).toBe(laUtc.minute);
    });
  });

  describe('areDatesEqual', () => {
    it('should return true for equal dates', () => {
      const date1 = new Date(2025, 4, 1, 10, 30, 0);
      const date2 = new Date(2025, 4, 1, 10, 30, 0);

      expect(testUtils.areDatesEqual(date1, date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new Date(2025, 4, 1, 10, 30, 0);
      const date2 = new Date(2025, 4, 1, 10, 31, 0);

      expect(testUtils.areDatesEqual(date1, date2)).toBe(false);
    });

    it('should ignore milliseconds', () => {
      const date1 = new Date(2025, 4, 1, 10, 30, 0, 0);
      const date2 = new Date(2025, 4, 1, 10, 30, 0, 500);

      expect(testUtils.areDatesEqual(date1, date2)).toBe(true);
    });
  });

  describe('isDateInRange', () => {
    it('should return true if date is within range', () => {
      const date = new Date(2025, 4, 15);
      const startDate = new Date(2025, 4, 1);
      const endDate = new Date(2025, 4, 31);

      expect(testUtils.isDateInRange(date, startDate, endDate)).toBe(true);
    });

    it('should return true if date is at start of range', () => {
      const date = new Date(2025, 4, 1);
      const startDate = new Date(2025, 4, 1);
      const endDate = new Date(2025, 4, 31);

      expect(testUtils.isDateInRange(date, startDate, endDate)).toBe(true);
    });

    it('should return true if date is at end of range', () => {
      const date = new Date(2025, 4, 31);
      const startDate = new Date(2025, 4, 1);
      const endDate = new Date(2025, 4, 31);

      expect(testUtils.isDateInRange(date, startDate, endDate)).toBe(true);
    });

    it('should return false if date is before range', () => {
      const date = new Date(2025, 3, 30);
      const startDate = new Date(2025, 4, 1);
      const endDate = new Date(2025, 4, 31);

      expect(testUtils.isDateInRange(date, startDate, endDate)).toBe(false);
    });

    it('should return false if date is after range', () => {
      const date = new Date(2025, 5, 1);
      const startDate = new Date(2025, 4, 1);
      const endDate = new Date(2025, 4, 31);

      expect(testUtils.isDateInRange(date, startDate, endDate)).toBe(false);
    });
  });

  describe('doRangesOverlap', () => {
    it('should return true if ranges overlap', () => {
      const range1Start = new Date(2025, 4, 1);
      const range1End = new Date(2025, 4, 15);
      const range2Start = new Date(2025, 4, 10);
      const range2End = new Date(2025, 4, 31);

      expect(
        testUtils.doRangesOverlap(range1Start, range1End, range2Start, range2End)
      ).toBe(true);
    });

    it('should return true if one range is contained within the other', () => {
      const range1Start = new Date(2025, 4, 1);
      const range1End = new Date(2025, 4, 31);
      const range2Start = new Date(2025, 4, 10);
      const range2End = new Date(2025, 4, 20);

      expect(
        testUtils.doRangesOverlap(range1Start, range1End, range2Start, range2End)
      ).toBe(true);
    });

    it('should return true if ranges share an endpoint', () => {
      const range1Start = new Date(2025, 4, 1);
      const range1End = new Date(2025, 4, 15);
      const range2Start = new Date(2025, 4, 15);
      const range2End = new Date(2025, 4, 31);

      expect(
        testUtils.doRangesOverlap(range1Start, range1End, range2Start, range2End)
      ).toBe(true);
    });

    it('should return false if ranges do not overlap', () => {
      const range1Start = new Date(2025, 4, 1);
      const range1End = new Date(2025, 4, 15);
      const range2Start = new Date(2025, 4, 16);
      const range2End = new Date(2025, 4, 31);

      expect(
        testUtils.doRangesOverlap(range1Start, range1End, range2Start, range2End)
      ).toBe(false);
    });
  });

  describe('TimeZoneService integration', () => {
    it('should validate time zones correctly', () => {
      const validTimeZone = 'America/New_York';
      const result = TimeZoneService.validateTimeZone(validTimeZone);
      expect(result).toBe(validTimeZone);
    });

    it('should throw an error for invalid time zones', () => {
      const invalidTimeZone = 'Invalid/TimeZone';
      expect(() => {
        TimeZoneService.validateTimeZone(invalidTimeZone);
      }).toThrow(CalendarError);
    });
  });
});