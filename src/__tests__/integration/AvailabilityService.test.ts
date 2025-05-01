import { AvailabilityService } from '../../services/calendar/AvailabilityService';
import { RecurrenceService } from '../../services/calendar/RecurrenceService';
import { TimeZoneService } from '../../services/calendar/TimeZoneService';
import { CalendarError } from '../../services/calendar/CalendarErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';

// Mock dependencies
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

jest.mock('../../services/calendar/RecurrenceService', () => ({
  RecurrenceService: {
    createRecurrencePattern: jest.fn(),
    getExceptions: jest.fn(),
    expandRecurrence: jest.fn(),
    deleteRecurrencePattern: jest.fn()
  }
}));

jest.mock('../../services/calendar/TimeZoneService', () => ({
  TimeZoneService: {
    validateTimeZone: jest.fn((tz) => tz)
  }
}));

describe('AvailabilityService Integration', () => {
  const mockClinicianId = 'clinician-123';
  const mockTimeZone = 'America/New_York';
  const mockStartTime = '2025-05-01T10:00:00.000Z';
  const mockEndTime = '2025-05-01T11:00:00.000Z';
  const mockRRule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
  const mockAvailabilityId = 'availability-123';
  const mockRecurrencePatternId = 'recurrence-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: mockAvailabilityId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        availability_type: 'single',
        is_active: true,
        time_zone: mockTimeZone
      },
      error: null
    });
    
    const mockEq = jest.fn(() => ({ 
      single: mockSingle,
      gte: jest.fn(() => ({
        lte: jest.fn().mockResolvedValue({
          data: [{
            id: mockAvailabilityId,
            clinician_id: mockClinicianId,
            start_time: mockStartTime,
            end_time: mockEndTime,
            availability_type: 'single',
            is_active: true,
            time_zone: mockTimeZone
          }],
          error: null
        })
      }))
    }));
    
    const mockSelect = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
    const mockInsertSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));
    
    const mockUpdateSelect = jest.fn(() => ({ single: mockSingle }));
    const mockUpdateEq = jest.fn(() => ({ select: mockUpdateSelect }));
    const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
    
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    });
    
    // Mock RecurrenceService
    (RecurrenceService.createRecurrencePattern as jest.Mock).mockResolvedValue(mockRecurrencePatternId);
    (RecurrenceService.getExceptions as jest.Mock).mockResolvedValue([]);
    (RecurrenceService.expandRecurrence as jest.Mock).mockReturnValue([
      { start: new Date(mockStartTime), end: new Date(mockEndTime) },
      { start: new Date('2025-05-08T10:00:00.000Z'), end: new Date('2025-05-08T11:00:00.000Z') },
      { start: new Date('2025-05-15T10:00:00.000Z'), end: new Date('2025-05-15T11:00:00.000Z') }
    ]);
  });

  describe('createAvailability', () => {
    it('should create a single availability block', async () => {
      const result = await AvailabilityService.createAvailability(
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        false
      );
      
      expect(result).toHaveProperty('id', mockAvailabilityId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      expect(result).toHaveProperty('start_time', mockStartTime);
      expect(result).toHaveProperty('end_time', mockEndTime);
      expect(result).toHaveProperty('availability_type', 'single');
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.insert).toHaveBeenCalledWith(expect.objectContaining({
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        availability_type: 'single',
        time_zone: mockTimeZone
      }));
    });

    it('should create a recurring availability block', async () => {
      const result = await AvailabilityService.createAvailability(
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        true,
        mockRRule
      );
      
      expect(result).toHaveProperty('id', mockAvailabilityId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      expect(result).toHaveProperty('start_time', mockStartTime);
      expect(result).toHaveProperty('end_time', mockEndTime);
      expect(result).toHaveProperty('availability_type', 'recurring');
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      expect(RecurrenceService.createRecurrencePattern).toHaveBeenCalledWith(mockRRule);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.insert).toHaveBeenCalledWith(expect.objectContaining({
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        availability_type: 'recurring',
        recurrence_pattern_id: mockRecurrencePatternId,
        time_zone: mockTimeZone
      }));
    });

    it('should throw an error if recurrence rule is missing for recurring availability', async () => {
      await expect(
        AvailabilityService.createAvailability(
          mockClinicianId,
          mockStartTime,
          mockEndTime,
          mockTimeZone,
          true // recurring but no rrule
        )
      ).rejects.toThrow(CalendarError);
      
      expect(RecurrenceService.createRecurrencePattern).not.toHaveBeenCalled();
    });

    it('should throw an error if start time is after end time', async () => {
      await expect(
        AvailabilityService.createAvailability(
          mockClinicianId,
          mockEndTime, // swapped
          mockStartTime, // swapped
          mockTimeZone,
          false
        )
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('getAvailability', () => {
    it('should get availability blocks for a clinician', async () => {
      const startDate = new Date('2025-05-01T00:00:00.000Z');
      const endDate = new Date('2025-05-31T23:59:59.999Z');
      
      const result = await AvailabilityService.getAvailability(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockAvailabilityId);
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('clinician_id', mockClinicianId);
    });

    it('should expand recurring availability blocks', async () => {
      // Mock a recurring availability block
      const mockRecurringBlock = {
        id: mockAvailabilityId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        availability_type: 'recurring',
        recurrence_pattern_id: mockRecurrencePatternId,
        is_active: true,
        time_zone: mockTimeZone,
        recurrence_patterns: [{ id: mockRecurrencePatternId, rrule: mockRRule }]
      };
      
      const mockEq = jest.fn(() => ({ 
        gte: jest.fn(() => ({
          lte: jest.fn().mockResolvedValue({
            data: [mockRecurringBlock],
            error: null
          })
        }))
      }));
      
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const startDate = new Date('2025-05-01T00:00:00.000Z');
      const endDate = new Date('2025-05-31T23:59:59.999Z');
      
      const result = await AvailabilityService.getAvailability(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      // Should include the original block plus the expanded occurrences
      expect(result.length).toBeGreaterThan(1);
      
      expect(RecurrenceService.getExceptions).toHaveBeenCalledWith(mockAvailabilityId);
      expect(RecurrenceService.expandRecurrence).toHaveBeenCalledWith(
        mockRRule,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        startDate,
        endDate
      );
    });
  });

  describe('getAvailabilityById', () => {
    it('should get a single availability block by ID', async () => {
      const result = await AvailabilityService.getAvailabilityById(mockAvailabilityId);
      
      expect(result).toHaveProperty('id', mockAvailabilityId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('id', mockAvailabilityId);
    });

    it('should return null if availability block is not found', async () => {
      // Mock not found response
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await AvailabilityService.getAvailabilityById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('updateAvailability', () => {
    it('should update an availability block', async () => {
      const updates = {
        start_time: '2025-05-01T09:00:00.000Z', // earlier start time
        is_active: false
      };
      
      const result = await AvailabilityService.updateAvailability(
        mockAvailabilityId,
        updates
      );
      
      expect(result).toHaveProperty('id', mockAvailabilityId);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.update).toHaveBeenCalledWith(updates);
      
      const updateMock = fromResult.update as jest.Mock;
      const updateResult = updateMock.mock.results[0].value;
      expect(updateResult.eq).toHaveBeenCalledWith('id', mockAvailabilityId);
    });

    it('should throw an error if availability block is not found', async () => {
      // Mock getAvailabilityById to return null
      jest.spyOn(AvailabilityService, 'getAvailabilityById').mockResolvedValue(null);
      
      await expect(
        AvailabilityService.updateAvailability(
          'non-existent-id',
          { is_active: false }
        )
      ).rejects.toThrow(CalendarError);
    });

    it('should validate time range if both start and end times are provided', async () => {
      const updates = {
        start_time: '2025-05-01T12:00:00.000Z', // after end time
        end_time: '2025-05-01T11:00:00.000Z'
      };
      
      await expect(
        AvailabilityService.updateAvailability(
          mockAvailabilityId,
          updates
        )
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('deleteAvailability', () => {
    it('should delete a single availability block', async () => {
      const result = await AvailabilityService.deleteAvailability(mockAvailabilityId);
      
      expect(result).toBe(true);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.delete).toHaveBeenCalled();
      
      const deleteMock = fromResult.delete as jest.Mock;
      const deleteResult = deleteMock.mock.results[0].value;
      expect(deleteResult.eq).toHaveBeenCalledWith('id', mockAvailabilityId);
    });

    it('should delete a recurring availability block and its recurrence pattern', async () => {
      // Mock a recurring availability block
      jest.spyOn(AvailabilityService, 'getAvailabilityById').mockResolvedValue({
        id: mockAvailabilityId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        availability_type: 'recurring',
        recurrence_pattern_id: mockRecurrencePatternId,
        is_active: true,
        time_zone: mockTimeZone
      });
      
      const result = await AvailabilityService.deleteAvailability(mockAvailabilityId);
      
      expect(result).toBe(true);
      
      // Should delete exceptions first
      expect(supabase.from).toHaveBeenCalledWith('availability_exceptions');
      
      // Then delete the block
      expect(supabase.from).toHaveBeenCalledWith('availability_blocks');
      
      // Finally delete the recurrence pattern
      expect(RecurrenceService.deleteRecurrencePattern).toHaveBeenCalledWith(mockRecurrencePatternId);
    });

    it('should throw an error if availability block is not found', async () => {
      // Mock getAvailabilityById to return null
      jest.spyOn(AvailabilityService, 'getAvailabilityById').mockResolvedValue(null);
      
      await expect(
        AvailabilityService.deleteAvailability('non-existent-id')
      ).rejects.toThrow(CalendarError);
    });
  });
});