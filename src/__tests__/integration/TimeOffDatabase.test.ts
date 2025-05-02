import { TimeOffService } from '@/services/calendar/TimeOffService';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('TimeOffService Database Integration', () => {
  const mockClinicianId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTimeZone = 'America/Chicago';
  const mockStartTime = '2025-05-01T10:00:00.000Z';
  const mockEndTime = '2025-05-01T17:00:00.000Z';
  const mockTimeOffId = 'timeoff-123';
  const mockReason = 'Personal day';
  const mockAllDay = false;

  // Mock database response data
  const mockTimeOffData = {
    id: mockTimeOffId,
    clinician_id: mockClinicianId,
    start_time: mockStartTime,
    end_time: mockEndTime,
    reason: mockReason,
    all_day: mockAllDay,
    time_zone: mockTimeZone
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Interactions', () => {
    it('should correctly insert time off data into the database', async () => {
      // Setup mock for database insert
      const mockInsertSingle = jest.fn().mockResolvedValue({
        data: mockTimeOffData,
        error: null
      });
      
      const mockInsertSelect = jest.fn(() => ({
        single: mockInsertSingle
      }));
      
      const mockInsert = jest.fn(() => ({
        select: mockInsertSelect
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });
      
      // Call the service method
      await TimeOffService.createTimeOff(
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        mockReason,
        mockAllDay
      );
      
      // Verify database interactions
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
        clinician_id: mockClinicianId,
        start_time: expect.any(String),
        end_time: expect.any(String),
        reason: mockReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      })]);
    });

    it('should correctly query time off data from the database', async () => {
      // Setup mock for database query
      const mockLte = jest.fn().mockResolvedValue({
        data: [mockTimeOffData],
        error: null
      });
      
      const mockGte = jest.fn(() => ({
        lte: mockLte
      }));
      
      const mockEq = jest.fn(() => ({
        gte: mockGte
      }));
      
      const mockSelect = jest.fn(() => ({
        eq: mockEq
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      // Call the service method
      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-31');
      
      const result = await TimeOffService.getTimeOffPeriods(
        mockClinicianId,
        startDate,
        endDate
      );
      
      // Verify database interactions
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('clinician_id', mockClinicianId);
      expect(mockGte).toHaveBeenCalledWith('start_time', startDate.toISOString());
      expect(mockLte).toHaveBeenCalledWith('end_time', endDate.toISOString());
      
      // Verify result transformation
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockTimeOffId);
      expect(result[0]).toHaveProperty('clinicianId', mockClinicianId);
      expect(result[0]).toHaveProperty('startTime');
      expect(result[0]).toHaveProperty('endTime');
      expect(result[0]).toHaveProperty('reason', mockReason);
      expect(result[0]).toHaveProperty('allDay', mockAllDay);
      expect(result[0]).toHaveProperty('timeZone', mockTimeZone);
    });

    it('should correctly update time off data in the database', async () => {
      // Setup mock for getTimeOffById
      const mockGetTimeOffById = jest.spyOn(TimeOffService, 'getTimeOffById')
        .mockResolvedValue({
          id: mockTimeOffId,
          clinicianId: mockClinicianId,
          startTime: new Date(mockStartTime),
          endTime: new Date(mockEndTime),
          reason: mockReason,
          allDay: mockAllDay,
          timeZone: mockTimeZone
        });
      
      // Setup mock for database update
      const mockUpdateSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockTimeOffData,
          reason: 'Updated reason'
        },
        error: null
      });
      
      const mockUpdateSelect = jest.fn(() => ({
        single: mockUpdateSingle
      }));
      
      const mockUpdateEq = jest.fn(() => ({
        select: mockUpdateSelect
      }));
      
      const mockUpdate = jest.fn(() => ({
        eq: mockUpdateEq
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate
      });
      
      // Call the service method
      const updates = {
        reason: 'Updated reason'
      };
      
      await TimeOffService.updateTimeOff(mockTimeOffId, updates);
      
      // Verify database interactions
      expect(mockGetTimeOffById).toHaveBeenCalledWith(mockTimeOffId);
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        reason: 'Updated reason'
      }));
      expect(mockUpdateEq).toHaveBeenCalledWith('id', mockTimeOffId);
      
      // Restore the spy
      mockGetTimeOffById.mockRestore();
    });

    it('should correctly delete time off data from the database', async () => {
      // Setup mock for database delete
      const mockDeleteEq = jest.fn().mockResolvedValue({
        error: null
      });
      
      const mockDelete = jest.fn(() => ({
        eq: mockDeleteEq
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete
      });
      
      // Call the service method
      const result = await TimeOffService.deleteTimeOff(mockTimeOffId);
      
      // Verify database interactions
      expect(supabase.from).toHaveBeenCalledWith('time_off');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('id', mockTimeOffId);
      expect(result).toBe(true);
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform database records to TimeOff objects', async () => {
      // Setup mock for database query
      const mockLte = jest.fn().mockResolvedValue({
        data: [mockTimeOffData],
        error: null
      });
      
      const mockGte = jest.fn(() => ({
        lte: mockLte
      }));
      
      const mockEq = jest.fn(() => ({
        gte: mockGte
      }));
      
      const mockSelect = jest.fn(() => ({
        eq: mockEq
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      // Call the service method
      const result = await TimeOffService.getTimeOffPeriods(mockClinicianId);
      
      // Verify result transformation
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockTimeOffId);
      expect(result[0]).toHaveProperty('clinicianId', mockClinicianId);
      expect(result[0].startTime instanceof Date).toBe(true);
      expect(result[0].endTime instanceof Date).toBe(true);
      
      // Verify the dates were converted to the correct timezone
      const startDateTime = DateTime.fromJSDate(result[0].startTime as Date);
      expect(startDateTime.zoneName).toBe(mockTimeZone);
      
      const endDateTime = DateTime.fromJSDate(result[0].endTime as Date);
      expect(endDateTime.zoneName).toBe(mockTimeZone);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during queries', async () => {
      // Setup mock for database error
      const mockEq = jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'DB_ERROR' }
          })
        }))
      }));
      
      const mockSelect = jest.fn(() => ({
        eq: mockEq
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      // Call the service method and expect an error
      await expect(
        TimeOffService.getTimeOffPeriods(mockClinicianId)
      ).rejects.toThrow();
    });

    it('should handle database errors during inserts', async () => {
      // Setup mock for database error
      const mockInsertSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert error', code: 'DB_ERROR' }
      });
      
      const mockInsertSelect = jest.fn(() => ({
        single: mockInsertSingle
      }));
      
      const mockInsert = jest.fn(() => ({
        select: mockInsertSelect
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });
      
      // Call the service method and expect an error
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