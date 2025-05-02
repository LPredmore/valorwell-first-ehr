import { TimeOffService } from '@/services/calendar/TimeOffService';
import { TimeZoneService } from '@/services/calendar/TimeZoneService';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';
import { CalendarError } from '@/services/calendar/CalendarErrorHandler';

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
        }))
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

jest.mock('@/services/calendar/TimeZoneService', () => ({
  TimeZoneService: {
    ensureIANATimeZone: jest.fn(tz => tz || 'America/Chicago'),
    validateTimeZone: jest.fn(tz => tz || 'America/Chicago')
  }
}));

describe('TimeOffService Unit Tests', () => {
  const mockClinicianId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTimeZone = 'America/Chicago';
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
    
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
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

  describe('Method Signatures', () => {
    it('createTimeOff should handle both Date and string parameters', async () => {
      // Test with string parameters
      await TimeOffService.createTimeOff(
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        mockReason,
        mockAllDay
      );
      
      // Test with Date parameters
      const startDate = new Date(mockStartTime);
      const endDate = new Date(mockEndTime);
      
      await TimeOffService.createTimeOff(
        mockClinicianId,
        startDate,
        endDate,
        mockTimeZone,
        mockReason,
        mockAllDay
      );
      
      // Verify TimeZoneService was called correctly
      expect(TimeZoneService.ensureIANATimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase was called
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
    
    it('getTimeOff should handle both Date and string parameters', async () => {
      // String dates
      const startDateStr = '2025-05-01T00:00:00Z';
      const endDateStr = '2025-05-31T23:59:59Z';
      
      await TimeOffService.getTimeOff(
        mockClinicianId,
        mockTimeZone,
        startDateStr,
        endDateStr
      );
      
      // Date objects
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      await TimeOffService.getTimeOff(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      // Verify getTimeOffPeriods was called with correct parameters
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
    
    it('getTimeOff should call getTimeOffPeriods with converted parameters', async () => {
      // Spy on getTimeOffPeriods
      const spy = jest.spyOn(TimeOffService, 'getTimeOffPeriods');
      
      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-31');
      
      await TimeOffService.getTimeOff(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      // Verify getTimeOffPeriods was called with correct parameters
      expect(spy).toHaveBeenCalledWith(mockClinicianId, startDate, endDate);
      
      // String dates should be converted to Date objects
      await TimeOffService.getTimeOff(
        mockClinicianId,
        mockTimeZone,
        '2025-05-01',
        '2025-05-31'
      );
      
      // The second call should have converted string dates to Date objects
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[1][1] instanceof Date).toBe(true);
      expect(spy.mock.calls[1][2] instanceof Date).toBe(true);
      
      spy.mockRestore();
    });
  });

  describe('toCalendarEvent', () => {
    it('should convert TimeOff object to CalendarEvent format', () => {
      const timeOff = {
        id: mockTimeOffId,
        clinicianId: mockClinicianId,
        startTime: mockStartTime,
        endTime: mockEndTime,
        reason: mockReason,
        allDay: mockAllDay,
        timeZone: mockTimeZone
      };
      
      const result = TimeOffService.toCalendarEvent(timeOff, mockTimeZone);
      
      expect(result).toEqual({
        id: mockTimeOffId,
        title: mockReason,
        start: mockStartTime,
        end: mockEndTime,
        allDay: mockAllDay,
        extendedProps: {
          type: 'time_off',
          clinicianId: mockClinicianId,
          timeZone: mockTimeZone
        }
      });
    });
    
    it('should handle database format TimeOff objects', () => {
      const timeOff = {
        id: mockTimeOffId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        reason: mockReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      };
      
      const result = TimeOffService.toCalendarEvent(timeOff, mockTimeZone);
      
      expect(result).toEqual({
        id: mockTimeOffId,
        title: mockReason,
        start: mockStartTime,
        end: mockEndTime,
        allDay: mockAllDay,
        extendedProps: {
          type: 'time_off',
          clinicianId: mockClinicianId,
          timeZone: mockTimeZone
        }
      });
    });
    
    it('should use default title if reason is not provided', () => {
      const timeOff = {
        id: mockTimeOffId,
        clinicianId: mockClinicianId,
        startTime: mockStartTime,
        endTime: mockEndTime,
        allDay: mockAllDay,
        timeZone: mockTimeZone
      };
      
      const result = TimeOffService.toCalendarEvent(timeOff, mockTimeZone);
      
      expect(result.title).toBe('Time Off');
    });
  });

  describe('Error Handling', () => {
    it('should validate start time is before end time', async () => {
      // Swap start and end times to create an error condition
      await expect(
        TimeOffService.createTimeOff(
          mockClinicianId,
          mockEndTime, // End time used as start time
          mockStartTime, // Start time used as end time
          mockTimeZone,
          mockReason,
          mockAllDay
        )
      ).rejects.toThrow(CalendarError);
    });
    
    it('should handle database errors', async () => {
      // Mock a database error
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      const mockErrorResponse = { data: null, error: mockError };
      
      const mockSingle = jest.fn().mockResolvedValue(mockErrorResponse);
      const mockInsertSelect = jest.fn(() => ({ single: mockSingle }));
      const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });
      
      await expect(
        TimeOffService.createTimeOff(
          mockClinicianId,
          mockStartTime,
          mockEndTime,
          mockTimeZone,
          mockReason,
          mockAllDay
        )
      ).rejects.toThrow();
    });
  });
});