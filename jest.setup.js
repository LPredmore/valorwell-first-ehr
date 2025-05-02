
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
jest.mock('@/utils/timezone', () => {
  const originalModule = jest.requireActual('@/utils/timezone');
  
  return {
    __esModule: true,
    ...originalModule,
    TimeZoneService: {
      ensureIANATimeZone: jest.fn(timezone => timezone || 'America/Chicago'),
      fromUTCTimestamp: jest.fn(timestamp => DateTime.fromISO(timestamp).setZone('America/Chicago')),
      toUTCTimestamp: jest.fn((timestamp, timezone) => DateTime.fromISO(timestamp).toUTC().toISO()),
      convertEventToUserTimeZone: jest.fn(event => event),
      formatTimeZoneDisplay: jest.fn(timezone => `${timezone} (Test)`),
      getCurrentTimeIn: jest.fn(timezone => DateTime.now().setZone(timezone || 'America/Chicago')),
      convertDateTime: jest.fn((dt, from, to) => dt)
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
