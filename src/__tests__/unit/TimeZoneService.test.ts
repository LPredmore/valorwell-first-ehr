import { TimeZoneService } from '../../services/calendar/TimeZoneService';
import { CalendarError } from '../../services/calendar/CalendarErrorHandler';
import { DateTime } from 'luxon';

// Mock the core TimeZoneService
jest.mock('@/utils/timezone', () => ({
  TimeZoneService: {
    ensureIANATimeZone: jest.fn((tz) => {
      if (tz === 'Invalid/TimeZone') {
        throw new Error('Invalid timezone');
      }
      return tz;
    }),
    parseWithZone: jest.fn((date, zone) => 
      DateTime.fromISO(date, { zone })
    ),
    formatDateTime: jest.fn((date, format, timeZone) => 
      `Formatted: ${date} with ${format} in ${timeZone}`
    ),
    createDateTime: jest.fn((dateStr, timeStr, timeZone) => 
      DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', { zone: timeZone })
    ),
    getCurrentDateTime: jest.fn((timeZone) => 
      DateTime.now().setZone(timeZone)
    ),
    toUTCTimestamp: jest.fn((date, timeZone) => 
      typeof date === 'string' 
        ? DateTime.fromISO(date, { zone: timeZone }).toUTC().toISO() 
        : DateTime.fromJSDate(date, { zone: timeZone }).toUTC().toISO()
    ),
    fromUTC: jest.fn((utcStr, timeZone) => 
      DateTime.fromISO(utcStr, { zone: 'utc' }).setZone(timeZone)
    ),
    formatTimeZoneDisplay: jest.fn((timeZone) => 
      `${timeZone} (UTC+X:XX)`
    )
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

describe('TimeZoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTimeZone', () => {
    it('should return the timezone if valid', () => {
      const result = TimeZoneService.validateTimeZone('America/New_York');
      expect(result).toBe('America/New_York');
    });

    it('should throw a CalendarError if timezone is invalid', () => {
      expect(() => {
        TimeZoneService.validateTimeZone('Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });

  describe('convertTimeZone', () => {
    it('should convert a date string from one timezone to another', () => {
      const date = '2025-05-01T10:00:00.000Z';
      const fromTimeZone = 'America/New_York';
      const toTimeZone = 'America/Los_Angeles';
      
      const result = TimeZoneService.convertTimeZone(date, fromTimeZone, toTimeZone);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('should convert a Date object from one timezone to another', () => {
      const date = new Date('2025-05-01T10:00:00.000Z');
      const fromTimeZone = 'America/New_York';
      const toTimeZone = 'America/Los_Angeles';
      
      const result = TimeZoneService.convertTimeZone(date, fromTimeZone, toTimeZone);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('should throw a CalendarError if conversion fails', () => {
      const date = '2025-05-01T10:00:00.000Z';
      
      expect(() => {
        TimeZoneService.convertTimeZone(date, 'Invalid/TimeZone', 'America/Los_Angeles');
      }).toThrow(CalendarError);
    });
  });

  describe('formatDateTime', () => {
    it('should format a date with the specified format and timezone', () => {
      const date = '2025-05-01T10:00:00.000Z';
      const format = 'yyyy-MM-dd HH:mm';
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.formatDateTime(date, format, timeZone);
      
      expect(result).toContain('Formatted:');
      expect(result).toContain(format);
      expect(result).toContain(timeZone);
    });

    it('should use default format if not provided', () => {
      const date = '2025-05-01T10:00:00.000Z';
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.formatDateTime(date, undefined, timeZone);
      
      expect(result).toContain('Formatted:');
      expect(result).toContain('yyyy-MM-dd HH:mm');
      expect(result).toContain(timeZone);
    });

    it('should throw a CalendarError if formatting fails', () => {
      const date = '2025-05-01T10:00:00.000Z';
      
      expect(() => {
        TimeZoneService.formatDateTime(date, undefined, 'Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });

  describe('createDateTime', () => {
    it('should create a DateTime object from date and time strings', () => {
      const dateStr = '2025-05-01';
      const timeStr = '10:00';
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.createDateTime(dateStr, timeStr, timeZone);
      
      expect(result).toBeInstanceOf(DateTime);
    });

    it('should throw a CalendarError if creation fails', () => {
      const dateStr = '2025-05-01';
      const timeStr = '10:00';
      
      expect(() => {
        TimeZoneService.createDateTime(dateStr, timeStr, 'Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });

  describe('getCurrentDateTime', () => {
    it('should get the current date and time in the specified timezone', () => {
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.getCurrentDateTime(timeZone);
      
      expect(result).toBeInstanceOf(DateTime);
    });

    it('should throw a CalendarError if getting current date time fails', () => {
      expect(() => {
        TimeZoneService.getCurrentDateTime('Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });

  describe('toUTC', () => {
    it('should convert a date string to UTC', () => {
      const date = '2025-05-01T10:00:00.000Z';
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.toUTC(date, timeZone);
      
      expect(typeof result).toBe('string');
    });

    it('should convert a Date object to UTC', () => {
      const date = new Date('2025-05-01T10:00:00.000Z');
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.toUTC(date, timeZone);
      
      expect(typeof result).toBe('string');
    });

    it('should throw a CalendarError if conversion to UTC fails', () => {
      const date = '2025-05-01T10:00:00.000Z';
      
      expect(() => {
        TimeZoneService.toUTC(date, 'Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });

  describe('fromUTC', () => {
    it('should convert a UTC date string to a date in the specified timezone', () => {
      const utcStr = '2025-05-01T10:00:00.000Z';
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.fromUTC(utcStr, timeZone);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('should throw a CalendarError if conversion from UTC fails', () => {
      const utcStr = '2025-05-01T10:00:00.000Z';
      
      expect(() => {
        TimeZoneService.fromUTC(utcStr, 'Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });

  describe('getTimeZoneDisplayName', () => {
    it('should get a user-friendly display name for a timezone', () => {
      const timeZone = 'America/New_York';
      
      const result = TimeZoneService.getTimeZoneDisplayName(timeZone);
      
      expect(result).toContain(timeZone);
    });

    it('should throw a CalendarError if getting display name fails', () => {
      expect(() => {
        TimeZoneService.getTimeZoneDisplayName('Invalid/TimeZone');
      }).toThrow(CalendarError);
    });
  });
});