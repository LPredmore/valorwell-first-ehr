import { TimeOffService } from '../../services/calendar/TimeOffService';
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

jest.mock('../../services/calendar/TimeZoneService', () => ({
  TimeZoneService: {
    validateTimeZone: jest.fn((tz) => tz),
    convertTimeZone: jest.fn((date, fromTz, toTz) => {
      if (typeof date === 'string') {
        return new Date(date);
      }
      return date;
    })
  }
}));

describe('TimeOffService Integration', () => {
  const mockClinicianId = 'clinician-123';
  const mockTimeZone = 'America/New_York';
  const mockStartTime = '2025-05-01T10:00:00.000Z';
  const mockEndTime = '2025-05-01T17:00:00.000Z';
  const mockTimeOffId = 'timeoff-123';
  const mockReason = 'Personal day';
  const mockAllDay = false;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: mockTimeOffId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        reason: mockReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      },
      error: null
    });
    
    const mockEq = jest.fn(() => ({ 
      single: mockSingle,
      gte: jest.fn(() => ({
        lte: jest.fn().mockResolvedValue({
          data: [{
            id: mockTimeOffId,
            clinician_id: mockClinicianId,
            start_time: mockStartTime,
            end_time: mockEndTime,
            reason: mockReason,
            all_day: mockAllDay,
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
  });

  describe('createTimeOff', () => {
    it('should create a time off period', async () => {
      const result = await TimeOffService.createTimeOff(
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        mockReason,
        mockAllDay
      );
      
      expect(result).toHaveProperty('id', mockTimeOffId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      expect(result).toHaveProperty('start_time', mockStartTime);
      expect(result).toHaveProperty('end_time', mockEndTime);
      expect(result).toHaveProperty('reason', mockReason);
      expect(result).toHaveProperty('all_day', mockAllDay);
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.insert).toHaveBeenCalledWith(expect.objectContaining({
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        reason: mockReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      }));
    });

    it('should throw an error if start time is after end time', async () => {
      await expect(
        TimeOffService.createTimeOff(
          mockClinicianId,
          mockEndTime, // swapped
          mockStartTime, // swapped
          mockTimeZone,
          mockReason,
          mockAllDay
        )
      ).rejects.toThrow(CalendarError);
    });

    it('should throw an error if clinician ID is missing', async () => {
      await expect(
        TimeOffService.createTimeOff(
          '', // empty clinician ID
          mockStartTime,
          mockEndTime,
          mockTimeZone,
          mockReason,
          mockAllDay
        )
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('getTimeOff', () => {
    it('should get time off periods for a clinician', async () => {
      const startDate = new Date('2025-05-01T00:00:00.000Z');
      const endDate = new Date('2025-05-31T23:59:59.999Z');
      
      const result = await TimeOffService.getTimeOff(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockTimeOffId);
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('clinician_id', mockClinicianId);
    });
  });

  describe('getTimeOffById', () => {
    it('should get a single time off period by ID', async () => {
      const result = await TimeOffService.getTimeOffById(mockTimeOffId);
      
      expect(result).toHaveProperty('id', mockTimeOffId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('id', mockTimeOffId);
    });

    it('should return null if time off period is not found', async () => {
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
      
      const result = await TimeOffService.getTimeOffById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('updateTimeOff', () => {
    it('should update a time off period', async () => {
      const updates = {
        start_time: '2025-05-01T09:00:00.000Z', // earlier start time
        reason: 'Updated reason'
      };
      
      const result = await TimeOffService.updateTimeOff(
        mockTimeOffId,
        updates
      );
      
      expect(result).toHaveProperty('id', mockTimeOffId);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.update).toHaveBeenCalledWith(updates);
      
      const updateMock = fromResult.update as jest.Mock;
      const updateResult = updateMock.mock.results[0].value;
      expect(updateResult.eq).toHaveBeenCalledWith('id', mockTimeOffId);
    });

    it('should throw an error if time off period is not found', async () => {
      // Mock getTimeOffById to return null
      jest.spyOn(TimeOffService, 'getTimeOffById').mockResolvedValue(null);
      
      await expect(
        TimeOffService.updateTimeOff(
          'non-existent-id',
          { reason: 'Updated reason' }
        )
      ).rejects.toThrow(CalendarError);
    });

    it('should validate time range if both start and end times are provided', async () => {
      const updates = {
        start_time: '2025-05-01T18:00:00.000Z', // after end time
        end_time: '2025-05-01T17:00:00.000Z'
      };
      
      await expect(
        TimeOffService.updateTimeOff(
          mockTimeOffId,
          updates
        )
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('deleteTimeOff', () => {
    it('should delete a time off period', async () => {
      const result = await TimeOffService.deleteTimeOff(mockTimeOffId);
      
      expect(result).toBe(true);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.delete).toHaveBeenCalled();
      
      const deleteMock = fromResult.delete as jest.Mock;
      const deleteResult = deleteMock.mock.results[0].value;
      expect(deleteResult.eq).toHaveBeenCalledWith('id', mockTimeOffId);
    });

    it('should throw an error if time off period is not found', async () => {
      // Mock getTimeOffById to return null
      jest.spyOn(TimeOffService, 'getTimeOffById').mockResolvedValue(null);
      
      await expect(
        TimeOffService.deleteTimeOff('non-existent-id')
      ).rejects.toThrow(CalendarError);
    });
  });
});