
// Import Jest DOM extensions for DOM testing
import '@testing-library/jest-dom';

// Mock the Luxon DateTime.now() to return a fixed date for tests
import { DateTime } from 'luxon';

// Set a fixed date for all tests
const fixedDate = DateTime.fromISO('2025-05-01T12:00:00.000Z');

// Mock DateTime.now() to return the fixed date
jest.spyOn(DateTime, 'now').mockImplementation(() => fixedDate);

// Mock the Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          gte: jest.fn(() => ({
            lte: jest.fn()
          }))
        })),
        single: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

// Mock the TimeZoneService
jest.mock('@/utils/timeZoneService', () => {
  const originalModule = jest.requireActual('@/utils/timeZoneService');
  
  return {
    __esModule: true,
    ...originalModule,
    TimeZoneService: {
      ensureIANATimeZone: jest.fn((timezone) => timezone || 'America/Chicago'),
      getLocalTimeZone: jest.fn(() => 'America/Chicago'),
      getUserTimeZone: jest.fn(() => 'America/Chicago'),
      fromUTC: jest.fn((timestamp, timezone) => DateTime.fromISO(timestamp).setZone('America/Chicago')),
      toUTC: jest.fn((datetime) => DateTime.fromISO(datetime.toString()).toUTC()),
      toUTCTimestamp: jest.fn((timestamp) => DateTime.fromISO(timestamp.toString()).toUTC().toISO()),
      fromUTCTimestamp: jest.fn((timestamp, timezone) => DateTime.fromISO(timestamp).setZone('America/Chicago')),
      convertEventToUserTimeZone: jest.fn((event) => event),
      formatTimeZoneDisplay: jest.fn((timezone) => `${timezone} (Test)`),
      getCurrentDateTime: jest.fn((timezone) => DateTime.now().setZone(timezone || 'America/Chicago')),
      convertDateTime: jest.fn((dt, from, to) => DateTime.fromISO(dt.toString()).setZone(to)),
      parseWithZone: jest.fn((str, zone) => DateTime.fromISO(str, { zone })),
      createDateTime: jest.fn((date, time, zone) => DateTime.fromISO(`${date}T${time}`, { zone })),
      formatDateTime: jest.fn((date, format) => "2025-05-01 12:00"),
      convertTimeZone: jest.fn((time, from, to) => time),
      formatTime: jest.fn((time) => "12:00 PM"),
      getCommonTimezones: jest.fn(() => [{ value: 'America/Chicago', label: 'Central Time (Test)' }]),
      getTimezoneOffsetString: jest.fn(() => "-05:00"),
      formatDate: jest.fn(() => "May 1, 2025"),
      isSameDay: jest.fn(() => true),
      addDuration: jest.fn((date) => date),
      getWeekdayName: jest.fn(() => "Monday"),
      getMonthName: jest.fn(() => "May")
    }
  };
});

// Set timezone for tests
process.env.TZ = 'America/Chicago';

// Suppress console errors during tests
console.error = jest.fn();
console.warn = jest.fn();

// Global test timeout
jest.setTimeout(10000);
