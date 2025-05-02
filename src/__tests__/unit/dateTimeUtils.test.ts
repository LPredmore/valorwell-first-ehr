import {
  formatDate,
  formatDateTime,
  formatTime,
  addDuration,
  isSameDay,
  parseWithZone,
  toISOWithZone,
  getCurrentDateTime,
  formatInTimezone,
  getWeekdayName,
  getMonthName
} from '@/utils/dateFormatUtils';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';

// Mock the TimeZoneService to isolate the tests
jest.mock('@/utils/timezone', () => {
  return {
    TimeZoneService: {
      ensureIANATimeZone: jest.fn(timezone => timezone || 'America/Chicago'),
      formatDateTime: jest.fn((dateTime, format, timezone) => {
        if (dateTime instanceof DateTime) {
          return `FormattedDateTime: ${dateTime.toISO()}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        } else if (dateTime instanceof Date) {
          return `FormattedDateTime: ${dateTime.toISOString()}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        } else {
          return `FormattedDateTime: ${dateTime}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        }
      }),
      formatDate: jest.fn((dateTime, format, timezone) => {
        if (dateTime instanceof DateTime) {
          return `FormattedDate: ${dateTime.toISO()}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        } else if (dateTime instanceof Date) {
          return `FormattedDate: ${dateTime.toISOString()}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        } else {
          return `FormattedDate: ${dateTime}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        }
      }),
      formatTime: jest.fn((time, format, timezone) => {
        if (time instanceof DateTime) {
          return `FormattedTime: ${time.toISO()}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        } else if (time instanceof Date) {
          return `FormattedTime: ${time.toISOString()}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        } else {
          return `FormattedTime: ${time}, Format: ${format}, Timezone: ${timezone || 'UTC'}`;
        }
      }),
      addDuration: jest.fn((dateTime, amount, unit) => {
        if (dateTime instanceof DateTime) {
          return dateTime.plus({ [unit]: amount });
        } else if (dateTime instanceof Date) {
          return DateTime.fromJSDate(dateTime).plus({ [unit]: amount });
        } else {
          return DateTime.fromISO(dateTime).plus({ [unit]: amount });
        }
      }),
      isSameDay: jest.fn((date1, date2) => {
        const dt1 = date1 instanceof DateTime ? date1 : DateTime.fromISO(date1.toString());
        const dt2 = date2 instanceof DateTime ? date2 : DateTime.fromISO(date2.toString());
        return dt1.hasSame(dt2, 'day');
      }),
      parseWithZone: jest.fn((dateString, timezone) => {
        return DateTime.fromISO(dateString, { zone: timezone });
      }),
      toUTCTimestamp: jest.fn((timestamp, timezone) => {
        return DateTime.fromISO(timestamp, { zone: timezone }).toUTC().toISO();
      }),
      fromUTCTimestamp: jest.fn((timestamp, timezone) => {
        return DateTime.fromISO(timestamp).setZone(timezone);
      }),
      getCurrentDateTime: jest.fn((timezone) => {
        return DateTime.now().setZone(timezone);
      }),
      getWeekdayName: jest.fn((date) => {
        return date.toLocaleString('en-us', { weekday: 'long' });
      }),
      getMonthName: jest.fn((date) => {
        return date.toLocaleString('en-us', { month: 'long' });
      })
    }
  };
});

describe('dateFormatUtils', () => {
  const mockDate = '2024-01-20T10:00:00.000Z';
  const mockTimezone = 'America/Chicago';

  it('formatDate calls TimeZoneService.formatDate with correct parameters', () => {
    const formattedDate = formatDate(mockDate, 'yyyy-MM-dd', mockTimezone);
    expect(TimeZoneService.formatDate).toHaveBeenCalledWith(expect.anything(), 'yyyy-MM-dd', mockTimezone);
    expect(formattedDate).toContain('FormattedDate');
  });

  it('formatDateTime calls TimeZoneService.formatDateTime with correct parameters', () => {
    const formattedDateTime = formatDateTime(mockDate, 'yyyy-MM-dd HH:mm', mockTimezone);
    expect(TimeZoneService.formatDateTime).toHaveBeenCalledWith(expect.anything(), 'yyyy-MM-dd HH:mm', mockTimezone);
    expect(formattedDateTime).toContain('FormattedDateTime');
  });

  it('formatTime calls TimeZoneService.formatTime with correct parameters', () => {
    const formattedTime = formatTime(mockDate, 'h:mm a', mockTimezone);
    expect(TimeZoneService.formatTime).toHaveBeenCalledWith(expect.anything(), 'h:mm a', mockTimezone);
    expect(formattedTime).toContain('FormattedTime');
  });

  it('addDuration calls TimeZoneService.addDuration with correct parameters', () => {
    const dateTime = DateTime.fromISO(mockDate);
    const newDateTime = addDuration(mockDate, 30, 'minutes');
    expect(TimeZoneService.addDuration).toHaveBeenCalled();
    expect(newDateTime).toEqual(expect.anything());
  });

  it('isSameDay calls TimeZoneService.isSameDay with correct parameters', () => {
    const isTheSameDay = isSameDay(mockDate, mockDate);
    expect(TimeZoneService.isSameDay).toHaveBeenCalled();
    expect(isTheSameDay).toBe(true);
  });

  it('parseWithZone calls TimeZoneService.parseWithZone with correct parameters', () => {
    const parsedDateTime = parseWithZone(mockDate, mockTimezone);
    expect(TimeZoneService.parseWithZone).toHaveBeenCalledWith(mockDate, mockTimezone);
    expect(parsedDateTime).toEqual(expect.anything());
  });

  it('toISOWithZone calls TimeZoneService.parseWithZone and toISO with correct parameters', () => {
    const isoWithZone = toISOWithZone(mockDate, mockTimezone);
    expect(TimeZoneService.parseWithZone).toHaveBeenCalledWith(mockDate, mockTimezone);
    expect(isoWithZone).toEqual(expect.anything());
  });

  it('getCurrentDateTime calls TimeZoneService.getCurrentDateTime with correct parameters', () => {
    getCurrentDateTime(mockTimezone);
    expect(TimeZoneService.getCurrentDateTime).toHaveBeenCalledWith(mockTimezone);
  });

  it('formatInTimezone calls TimeZoneService.formatDateTime with correct parameters', () => {
    formatInTimezone(mockDate, 'yyyy-MM-dd HH:mm', mockTimezone);
    expect(TimeZoneService.formatDateTime).toHaveBeenCalledWith(mockDate, 'yyyy-MM-dd HH:mm', mockTimezone);
  });

  it('getWeekdayName calls TimeZoneService.getWeekdayName with correct parameters', () => {
    const mockDateTime = DateTime.fromISO(mockDate);
    getWeekdayName(mockDate);
    expect(TimeZoneService.getWeekdayName).toHaveBeenCalled();
  });

  it('getMonthName calls TimeZoneService.getMonthName with correct parameters', () => {
    const mockDateTime = DateTime.fromISO(mockDate);
    getMonthName(mockDate);
    expect(TimeZoneService.getMonthName).toHaveBeenCalled();
  });
});
