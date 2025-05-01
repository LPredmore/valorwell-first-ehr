import { RecurrenceService } from '../../services/calendar/RecurrenceService';
import { TimeZoneService } from '../../services/calendar/TimeZoneService';
import { CalendarError } from '../../services/calendar/CalendarErrorHandler';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { DateTime } from 'luxon';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        single: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

jest.mock('../../services/calendar/TimeZoneService', () => ({
  TimeZoneService: {
    validateTimeZone: jest.fn((tz) => {
      if (tz === 'Invalid/TimeZone') {
        throw new Error('Invalid timezone');
      }
      return tz;
    })
  }
}));

// Mock rrule
jest.mock('rrule', () => {
  const originalModule = jest.requireActual('rrule');
  return {
    ...originalModule,
    rrulestr: jest.fn().mockImplementation((rrule) => ({
      between: jest.fn().mockReturnValue([
        new Date('2025-05-01T10:00:00Z'),
        new Date('2025-05-08T10:00:00Z'),
        new Date('2025-05-15T10:00:00Z')
      ])
    }))
  };
});

describe('RecurrenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'test-id', rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' },
      error: null
    });
    
    const mockEq = jest.fn(() => ({ single: mockSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
    const mockInsertSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));
    const mockDelete = jest.fn(() => ({ eq: mockEq }));
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    });
  });

  describe('createRecurrencePattern', () => {
    it('should create a recurrence pattern in the database', async () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      
      const result = await RecurrenceService.createRecurrencePattern(rrule);
      
      expect(result).toBe('test-id');
      expect(supabase.from).toHaveBeenCalledWith('recurrence_patterns');
      
      // Get the mock functions from the chain
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.insert).toHaveBeenCalledWith({ rrule });
    });

    it('should throw a CalendarError if creation fails', async () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      await expect(RecurrenceService.createRecurrencePattern(rrule))
        .rejects.toThrow(CalendarError);
    });
  });

  describe('getRecurrencePattern', () => {
    it('should retrieve a recurrence pattern from the database', async () => {
      const id = 'test-id';
      
      const result = await RecurrenceService.getRecurrencePattern(id);
      
      expect(result).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR');
      expect(supabase.from).toHaveBeenCalledWith('recurrence_patterns');
      
      // Get the mock functions from the chain
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalledWith('rrule');
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('id', id);
    });

    it('should throw a CalendarError if retrieval fails', async () => {
      const id = 'test-id';
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      await expect(RecurrenceService.getRecurrencePattern(id))
        .rejects.toThrow(CalendarError);
    });
  });

  describe('updateRecurrencePattern', () => {
    it('should update a recurrence pattern in the database', async () => {
      const id = 'test-id';
      const rrule = 'FREQ=WEEKLY;BYDAY=TU,TH';
      
      const result = await RecurrenceService.updateRecurrencePattern(id, rrule);
      
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('recurrence_patterns');
      
      // Get the mock functions from the chain
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.update).toHaveBeenCalledWith(expect.objectContaining({ rrule }));
      
      const updateMock = fromResult.update as jest.Mock;
      const updateResult = updateMock.mock.results[0].value;
      expect(updateResult.eq).toHaveBeenCalledWith('id', id);
    });

    it('should throw a CalendarError if update fails', async () => {
      const id = 'test-id';
      const rrule = 'FREQ=WEEKLY;BYDAY=TU,TH';
      
      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Database error' }
      });
      
      await expect(RecurrenceService.updateRecurrencePattern(id, rrule))
        .rejects.toThrow(CalendarError);
    });
  });

  describe('deleteRecurrencePattern', () => {
    it('should delete a recurrence pattern from the database', async () => {
      const id = 'test-id';
      
      const mockEq = jest.fn().mockResolvedValue({
        error: null
      });
      
      const result = await RecurrenceService.deleteRecurrencePattern(id);
      
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('recurrence_patterns');
      
      // Get the mock functions from the chain
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.delete).toHaveBeenCalled();
      
      const deleteMock = fromResult.delete as jest.Mock;
      const deleteResult = deleteMock.mock.results[0].value;
      expect(deleteResult.eq).toHaveBeenCalledWith('id', id);
    });

    it('should throw a CalendarError if deletion fails', async () => {
      const id = 'test-id';
      
      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Database error' }
      });
      
      await expect(RecurrenceService.deleteRecurrencePattern(id))
        .rejects.toThrow(CalendarError);
    });
  });

  describe('createException', () => {
    it('should create a recurrence exception for a recurring event', async () => {
      const availabilityBlockId = 'block-id';
      const exceptionDate = '2025-05-01T10:00:00Z';
      const isCancelled = true;
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'exception-id' },
        error: null
      });
      
      const result = await RecurrenceService.createException(
        availabilityBlockId,
        exceptionDate,
        isCancelled
      );
      
      expect(result).toBe('exception-id');
      expect(supabase.from).toHaveBeenCalledWith('availability_exceptions');
      
      // Get the mock functions from the chain
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.insert).toHaveBeenCalledWith({
        availability_block_id: availabilityBlockId,
        exception_date: exceptionDate,
        is_cancelled: isCancelled,
        replacement_block_id: undefined
      });
    });

    it('should throw a CalendarError if exception creation fails', async () => {
      const availabilityBlockId = 'block-id';
      const exceptionDate = '2025-05-01T10:00:00Z';
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      await expect(RecurrenceService.createException(availabilityBlockId, exceptionDate))
        .rejects.toThrow(CalendarError);
    });
  });

  describe('getExceptions', () => {
    it('should get all exceptions for a recurring event', async () => {
      const availabilityBlockId = 'block-id';
      const mockExceptions = [
        { id: 'exception-1', exception_date: '2025-05-01T10:00:00Z', is_cancelled: true },
        { id: 'exception-2', exception_date: '2025-05-08T10:00:00Z', is_cancelled: true }
      ];
      
      const mockEq = jest.fn().mockResolvedValue({
        data: mockExceptions,
        error: null
      });
      
      const result = await RecurrenceService.getExceptions(availabilityBlockId);
      
      expect(result).toEqual(mockExceptions);
      expect(supabase.from).toHaveBeenCalledWith('availability_exceptions');
      
      // Get the mock functions from the chain
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalledWith('*');
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('availability_block_id', availabilityBlockId);
    });

    it('should throw a CalendarError if getting exceptions fails', async () => {
      const availabilityBlockId = 'block-id';
      
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      await expect(RecurrenceService.getExceptions(availabilityBlockId))
        .rejects.toThrow(CalendarError);
    });
  });

  describe('expandRecurrence', () => {
    it('should expand a recurring event into individual occurrences', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const startDate = '2025-05-01T10:00:00Z';
      const endDate = '2025-05-01T11:00:00Z';
      const timeZone = 'America/New_York';
      
      const result = RecurrenceService.expandRecurrence(
        rrule,
        startDate,
        endDate,
        timeZone
      );
      
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('start');
      expect(result[0]).toHaveProperty('end');
      expect(rrulestr).toHaveBeenCalledWith(rrule);
    });

    it('should throw a CalendarError if expansion fails', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const startDate = '2025-05-01T10:00:00Z';
      const endDate = '2025-05-01T11:00:00Z';
      
      (TimeZoneService.validateTimeZone as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid timezone');
      });
      
      expect(() => {
        RecurrenceService.expandRecurrence(
          rrule,
          startDate,
          endDate,
          'Invalid/TimeZone'
        );
      }).toThrow(CalendarError);
    });
  });

  describe('isOccurrence', () => {
    it('should check if a date is an occurrence of a recurring event', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const startDate = '2025-05-01T10:00:00Z';
      const checkDate = '2025-05-08T10:00:00Z';
      const timeZone = 'America/New_York';
      
      const result = RecurrenceService.isOccurrence(
        rrule,
        startDate,
        checkDate,
        timeZone
      );
      
      expect(result).toBe(true);
      expect(rrulestr).toHaveBeenCalledWith(rrule);
    });

    it('should throw a CalendarError if checking fails', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const startDate = '2025-05-01T10:00:00Z';
      const checkDate = '2025-05-08T10:00:00Z';
      
      (TimeZoneService.validateTimeZone as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid timezone');
      });
      
      expect(() => {
        RecurrenceService.isOccurrence(
          rrule,
          startDate,
          checkDate,
          'Invalid/TimeZone'
        );
      }).toThrow(CalendarError);
    });
  });

  describe('getNextOccurrence', () => {
    it('should get the next occurrence of a recurring event after a specified date', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const startDate = '2025-05-01T10:00:00Z';
      const afterDate = '2025-05-02T10:00:00Z';
      const timeZone = 'America/New_York';
      
      const result = RecurrenceService.getNextOccurrence(
        rrule,
        startDate,
        afterDate,
        timeZone
      );
      
      expect(result).toBeInstanceOf(Date);
      expect(rrulestr).toHaveBeenCalledWith(rrule);
    });

    it('should throw a CalendarError if getting next occurrence fails', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const startDate = '2025-05-01T10:00:00Z';
      const afterDate = '2025-05-02T10:00:00Z';
      
      (TimeZoneService.validateTimeZone as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid timezone');
      });
      
      expect(() => {
        RecurrenceService.getNextOccurrence(
          rrule,
          startDate,
          afterDate,
          'Invalid/TimeZone'
        );
      }).toThrow(CalendarError);
    });
  });

  describe('createRRule', () => {
    it('should create an RRule string from parameters', () => {
      const frequency = 'WEEKLY';
      const interval = 1;
      const startDate = '2025-05-01T10:00:00Z';
      const byDay = ['MO', 'WE', 'FR'];
      const timeZone = 'America/New_York';
      
      const result = RecurrenceService.createRRule(
        frequency as any,
        interval,
        startDate,
        undefined,
        undefined,
        byDay
      );
      
      expect(typeof result).toBe('string');
      expect(result).toContain('FREQ=WEEKLY');
      expect(result).toContain('INTERVAL=1');
      expect(result).toContain('BYDAY=MO,WE,FR');
    });

    it('should throw a CalendarError if RRule creation fails', () => {
      const frequency = 'WEEKLY';
      const interval = 1;
      const startDate = '2025-05-01T10:00:00Z';
      
      (TimeZoneService.validateTimeZone as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid timezone');
      });
      
      expect(() => {
        RecurrenceService.createRRule(
          frequency as any,
          interval,
          startDate,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'Invalid/TimeZone'
        );
      }).toThrow(CalendarError);
    });
  });
});