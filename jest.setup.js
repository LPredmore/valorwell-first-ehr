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

// Set timezone for tests
process.env.TZ = 'America/Chicago';

// Suppress console errors during tests
console.error = jest.fn();
console.warn = jest.fn();

// Global test timeout
jest.setTimeout(10000);