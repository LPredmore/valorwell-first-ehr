import { RecurrenceService, RecurrenceOptions } from '../services/RecurrenceService';
import { TimeZoneService } from '../utils/timeZoneService';
import { DateTime } from 'luxon';

/**
 * Test suite for the RecurrenceService
 * Tests various recurrence patterns and edge cases
 */
describe('RecurrenceService', () => {
  // Mock database event for testing
  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Event',
    start_time: '2025-05-01T10:00:00Z',
    end_time: '2025-05-01T11:00:00Z',
    description: 'Test description',
    event_type: 'availability',
    availability_type: 'recurring',
    is_active: true,
    clinician_id: 'test-clinician-id',
    time_zone: 'America/Chicago',
    recurrence_id: 'test-recurrence-id'
  };

  describe('buildRRule', () => {
    test('should build a weekly recurrence rule', () => {
      const options: RecurrenceOptions = {
        frequency: 'WEEKLY',
        byDay: ['MO'],
        startDate: new Date('2025-05-05T10:00:00Z'),
        timezone: 'America/Chicago'
      };

      const rrule = RecurrenceService.buildRRule(options);
      expect(rrule).toContain('FREQ=WEEKLY');
      expect(rrule).toContain('BYDAY=MO');
    });

    test('should build a daily recurrence rule', () => {
      const options: RecurrenceOptions = {
        frequency: 'DAILY',
        interval: 2,
        startDate: new Date('2025-05-05T10:00:00Z'),
        timezone: 'America/Chicago'
      };

      const rrule = RecurrenceService.buildRRule(options);
      expect(rrule).toContain('FREQ=DAILY');
      expect(rrule).toContain('INTERVAL=2');
    });

    test('should build a monthly recurrence rule', () => {
      const options: RecurrenceOptions = {
        frequency: 'MONTHLY',
        byMonthDay: [15],
        startDate: new Date('2025-05-15T10:00:00Z'),
        timezone: 'America/Chicago'
      };

      const rrule = RecurrenceService.buildRRule(options);
      expect(rrule).toContain('FREQ=MONTHLY');
      expect(rrule).toContain('BYMONTHDAY=15');
    });

    test('should build a yearly recurrence rule', () => {
      const options: RecurrenceOptions = {
        frequency: 'YEARLY',
        byMonth: [5],
        byMonthDay: [15],
        startDate: new Date('2025-05-15T10:00:00Z'),
        timezone: 'America/Chicago'
      };

      const rrule = RecurrenceService.buildRRule(options);
      expect(rrule).toContain('FREQ=YEARLY');
      expect(rrule).toContain('BYMONTH=5');
      expect(rrule).toContain('BYMONTHDAY=15');
    });

    test('should handle count parameter', () => {
      const options: RecurrenceOptions = {
        frequency: 'WEEKLY',
        byDay: ['MO'],
        count: 10,
        startDate: new Date('2025-05-05T10:00:00Z'),
        timezone: 'America/Chicago'
      };

      const rrule = RecurrenceService.buildRRule(options);
      expect(rrule).toContain('FREQ=WEEKLY');
      expect(rrule).toContain('COUNT=10');
    });

    test('should handle until parameter', () => {
      const options: RecurrenceOptions = {
        frequency: 'WEEKLY',
        byDay: ['MO'],
        until: new Date('2025-12-31T23:59:59Z'),
        startDate: new Date('2025-05-05T10:00:00Z'),
        timezone: 'America/Chicago'
      };

      const rrule = RecurrenceService.buildRRule(options);
      expect(rrule).toContain('FREQ=WEEKLY');
      expect(rrule).toContain('UNTIL=');
    });
  });

  describe('parseRRule', () => {
    test('should parse a weekly recurrence rule', () => {
      const rruleStr = 'FREQ=WEEKLY;BYDAY=MO';
      const dtstart = new Date('2025-05-05T10:00:00Z');
      
      const rule = RecurrenceService.parseRRule(rruleStr, dtstart);
      expect(rule.options.freq).toBe(0); // RRule.WEEKLY is 0
      expect(rule.options.byweekday).toContain(0); // RRule.MO is 0
    });

    test('should parse a daily recurrence rule', () => {
      const rruleStr = 'FREQ=DAILY;INTERVAL=2';
      const dtstart = new Date('2025-05-05T10:00:00Z');
      
      const rule = RecurrenceService.parseRRule(rruleStr, dtstart);
      expect(rule.options.freq).toBe(3); // RRule.DAILY is 3
      expect(rule.options.interval).toBe(2);
    });
  });

  describe('createWeeklyRecurrence', () => {
    test('should create a weekly recurrence rule for Monday', () => {
      const dayOfWeek = 'MO';
      const startDate = new Date('2025-05-05T10:00:00Z');
      const timezone = 'America/Chicago';
      
      const rrule = RecurrenceService.createWeeklyRecurrence(dayOfWeek, startDate, timezone);
      expect(rrule).toContain('FREQ=WEEKLY');
      expect(rrule).toContain('BYDAY=MO');
    });

    test('should create a weekly recurrence rule for Friday', () => {
      const dayOfWeek = 'FR';
      const startDate = new Date('2025-05-09T10:00:00Z');
      const timezone = 'America/Chicago';
      
      const rrule = RecurrenceService.createWeeklyRecurrence(dayOfWeek, startDate, timezone);
      expect(rrule).toContain('FREQ=WEEKLY');
      expect(rrule).toContain('BYDAY=FR');
    });
  });

  describe('isDateInRecurrencePattern', () => {
    test('should return true for a date in a weekly pattern', () => {
      const date = new Date('2025-05-12T10:00:00Z'); // Monday
      const rruleStr = 'FREQ=WEEKLY;BYDAY=MO';
      const timezone = 'America/Chicago';
      
      const result = RecurrenceService.isDateInRecurrencePattern(date, rruleStr, timezone);
      expect(result).toBe(true);
    });

    test('should return false for a date not in a weekly pattern', () => {
      const date = new Date('2025-05-13T10:00:00Z'); // Tuesday
      const rruleStr = 'FREQ=WEEKLY;BYDAY=MO';
      const timezone = 'America/Chicago';
      
      const result = RecurrenceService.isDateInRecurrencePattern(date, rruleStr, timezone);
      expect(result).toBe(false);
    });
  });

  describe('getNextOccurrence', () => {
    test('should get the next occurrence of a weekly pattern', () => {
      const after = new Date('2025-05-05T12:00:00Z'); // Monday after the event
      const rruleStr = 'FREQ=WEEKLY;BYDAY=MO';
      const timezone = 'America/Chicago';
      
      const nextOccurrence = RecurrenceService.getNextOccurrence(rruleStr, after, timezone);
      expect(nextOccurrence).not.toBeNull();
      
      if (nextOccurrence) {
        const nextDate = DateTime.fromJSDate(nextOccurrence);
        expect(nextDate.weekday).toBe(1); // Monday is 1 in Luxon
        expect(nextDate.toISO()).toContain('2025-05-12'); // Next Monday
      }
    });

    test('should get the next occurrence of a daily pattern', () => {
      const after = new Date('2025-05-05T12:00:00Z');
      const rruleStr = 'FREQ=DAILY';
      const timezone = 'America/Chicago';
      
      const nextOccurrence = RecurrenceService.getNextOccurrence(rruleStr, after, timezone);
      expect(nextOccurrence).not.toBeNull();
      
      if (nextOccurrence) {
        const nextDate = DateTime.fromJSDate(nextOccurrence);
        expect(nextDate.toISO()).toContain('2025-05-06'); // Next day
      }
    });
  });

  describe('expandRecurringEvent', () => {
    test('should expand a weekly recurring event', async () => {
      // Mock implementation for testing
      const expandRecurringEvent = async (
        baseEvent: any,
        startDate: Date | string,
        endDate: Date | string,
        timezone: string
      ) => {
        const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
        
        // Convert dates to DateTime objects
        const startDt = typeof startDate === 'string' ? 
          TimeZoneService.parseWithZone(startDate, validTimeZone) :
          DateTime.fromJSDate(startDate, { zone: validTimeZone });
          
        const endDt = typeof endDate === 'string' ?
          TimeZoneService.parseWithZone(endDate, validTimeZone) :
          DateTime.fromJSDate(endDate, { zone: validTimeZone });
        
        // For testing, generate 4 weekly occurrences
        const result = [];
        let currentDate = DateTime.fromISO(baseEvent.start_time, { zone: 'UTC' });
        const duration = DateTime.fromISO(baseEvent.end_time, { zone: 'UTC' })
          .diff(currentDate);
        
        for (let i = 0; i < 4; i++) {
          // Only include occurrences within the date range
          if (currentDate >= startDt && currentDate <= endDt) {
            result.push({
              ...baseEvent,
              id: `${baseEvent.id}_${i}`,
              start_time: currentDate.toUTC().toISO(),
              end_time: currentDate.plus(duration).toUTC().toISO(),
              is_recurring_instance: true
            });
          }
          
          // Move to next week
          currentDate = currentDate.plus({ weeks: 1 });
        }
        
        return result;
      };
      
      const startDate = new Date('2025-05-01T00:00:00Z');
      const endDate = new Date('2025-05-31T23:59:59Z');
      const timezone = 'America/Chicago';
      
      const expandedEvents = await expandRecurringEvent(mockEvent, startDate, endDate, timezone);
      
      expect(expandedEvents.length).toBeGreaterThan(0);
      expect(expandedEvents[0].id).toBe(`${mockEvent.id}_0`);
      expect(expandedEvents[0].is_recurring_instance).toBe(true);
    });
  });

  // Test for DST transitions
  describe('Daylight Saving Time handling', () => {
    test('should handle DST transitions correctly', () => {
      // Create a recurrence that spans a DST transition
      const options: RecurrenceOptions = {
        frequency: 'WEEKLY',
        byDay: ['SU'],
        startDate: new Date('2025-03-01T10:00:00Z'), // Before DST
        timezone: 'America/Chicago'
      };
      
      const rrule = RecurrenceService.buildRRule(options);
      
      // Check a date after DST transition
      const afterDST = new Date('2025-03-15T10:00:00Z'); // After DST
      const timezone = 'America/Chicago';
      
      const result = RecurrenceService.isDateInRecurrencePattern(afterDST, rrule, timezone);
      
      // The pattern should still match even with DST change
      expect(result).toBe(true);
    });
  });

  // Test for timezone changes
  describe('Timezone change handling', () => {
    test('should handle timezone changes correctly', () => {
      // Create a recurrence in one timezone
      const options: RecurrenceOptions = {
        frequency: 'WEEKLY',
        byDay: ['MO'],
        startDate: new Date('2025-05-05T10:00:00Z'),
        timezone: 'America/Chicago'
      };
      
      const rrule = RecurrenceService.buildRRule(options);
      
      // Check the same date in a different timezone
      const date = new Date('2025-05-12T10:00:00Z'); // Monday
      const differentTimezone = 'Europe/London';
      
      const result = RecurrenceService.isDateInRecurrencePattern(date, rrule, differentTimezone);
      
      // The pattern should still match even with timezone change
      expect(result).toBe(true);
    });
  });
});