import { AppointmentService } from '../../services/calendar/AppointmentService';
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

describe('AppointmentService Integration', () => {
  const mockClinicianId = 'clinician-123';
  const mockClientId = 'client-123';
  const mockTimeZone = 'America/New_York';
  const mockStartTime = '2025-05-01T10:00:00.000Z';
  const mockEndTime = '2025-05-01T11:00:00.000Z';
  const mockAppointmentId = 'appointment-123';
  const mockAppointmentType = 'Initial Consultation';
  const mockAppointmentStatus = 'scheduled';
  const mockNotes = 'Test appointment notes';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: mockAppointmentId,
        client_id: mockClientId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        type: mockAppointmentType,
        status: mockAppointmentStatus,
        notes: mockNotes,
        time_zone: mockTimeZone
      },
      error: null
    });
    
    const mockEq = jest.fn(() => ({ 
      single: mockSingle,
      gte: jest.fn(() => ({
        lte: jest.fn().mockResolvedValue({
          data: [{
            id: mockAppointmentId,
            client_id: mockClientId,
            clinician_id: mockClinicianId,
            start_time: mockStartTime,
            end_time: mockEndTime,
            type: mockAppointmentType,
            status: mockAppointmentStatus,
            notes: mockNotes,
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

  describe('createAppointment', () => {
    it('should create an appointment', async () => {
      const result = await AppointmentService.createAppointment(
        mockClientId,
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockAppointmentType,
        mockTimeZone,
        mockNotes
      );
      
      expect(result).toHaveProperty('id', mockAppointmentId);
      expect(result).toHaveProperty('client_id', mockClientId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      expect(result).toHaveProperty('start_time', mockStartTime);
      expect(result).toHaveProperty('end_time', mockEndTime);
      expect(result).toHaveProperty('type', mockAppointmentType);
      expect(result).toHaveProperty('status', mockAppointmentStatus);
      expect(result).toHaveProperty('notes', mockNotes);
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.insert).toHaveBeenCalledWith(expect.objectContaining({
        client_id: mockClientId,
        clinician_id: mockClinicianId,
        start_time: mockStartTime,
        end_time: mockEndTime,
        type: mockAppointmentType,
        notes: mockNotes,
        time_zone: mockTimeZone
      }));
    });

    it('should throw an error if start time is after end time', async () => {
      await expect(
        AppointmentService.createAppointment(
          mockClientId,
          mockClinicianId,
          mockEndTime, // swapped
          mockStartTime, // swapped
          mockAppointmentType,
          mockTimeZone,
          mockNotes
        )
      ).rejects.toThrow(CalendarError);
    });

    it('should throw an error if client ID is missing', async () => {
      await expect(
        AppointmentService.createAppointment(
          '', // empty client ID
          mockClinicianId,
          mockStartTime,
          mockEndTime,
          mockAppointmentType,
          mockTimeZone,
          mockNotes
        )
      ).rejects.toThrow(CalendarError);
    });

    it('should throw an error if clinician ID is missing', async () => {
      await expect(
        AppointmentService.createAppointment(
          mockClientId,
          '', // empty clinician ID
          mockStartTime,
          mockEndTime,
          mockAppointmentType,
          mockTimeZone,
          mockNotes
        )
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('getAppointments', () => {
    it('should get appointments for a clinician', async () => {
      const startDate = new Date('2025-05-01T00:00:00.000Z');
      const endDate = new Date('2025-05-31T23:59:59.999Z');
      
      const result = await AppointmentService.getAppointments(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockAppointmentId);
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('clinician_id', mockClinicianId);
    });

    it('should get appointments for a client', async () => {
      const startDate = new Date('2025-05-01T00:00:00.000Z');
      const endDate = new Date('2025-05-31T23:59:59.999Z');
      
      const result = await AppointmentService.getClientAppointments(
        mockClientId,
        mockTimeZone,
        startDate,
        endDate
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockAppointmentId);
      
      expect(TimeZoneService.validateTimeZone).toHaveBeenCalledWith(mockTimeZone);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('client_id', mockClientId);
    });

    it('should filter appointments by status if provided', async () => {
      const startDate = new Date('2025-05-01T00:00:00.000Z');
      const endDate = new Date('2025-05-31T23:59:59.999Z');
      const status = 'scheduled';
      
      // Mock the eq chain for status filter
      const mockStatusEq = jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn().mockResolvedValue({
            data: [{
              id: mockAppointmentId,
              client_id: mockClientId,
              clinician_id: mockClinicianId,
              start_time: mockStartTime,
              end_time: mockEndTime,
              type: mockAppointmentType,
              status: mockAppointmentStatus,
              notes: mockNotes,
              time_zone: mockTimeZone
            }],
            error: null
          })
        }))
      }));
      
      const mockClinicianEq = jest.fn(() => ({ 
        eq: mockStatusEq
      }));
      
      const mockSelect = jest.fn(() => ({ eq: mockClinicianEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await AppointmentService.getAppointments(
        mockClinicianId,
        mockTimeZone,
        startDate,
        endDate,
        status
      );
      
      expect(result).toHaveLength(1);
      
      // Verify status filter was applied
      expect(mockClinicianEq).toHaveBeenCalledWith('status', status);
    });
  });

  describe('getAppointmentById', () => {
    it('should get a single appointment by ID', async () => {
      const result = await AppointmentService.getAppointmentById(mockAppointmentId);
      
      expect(result).toHaveProperty('id', mockAppointmentId);
      expect(result).toHaveProperty('client_id', mockClientId);
      expect(result).toHaveProperty('clinician_id', mockClinicianId);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.select).toHaveBeenCalled();
      
      const selectMock = fromResult.select as jest.Mock;
      const selectResult = selectMock.mock.results[0].value;
      expect(selectResult.eq).toHaveBeenCalledWith('id', mockAppointmentId);
    });

    it('should return null if appointment is not found', async () => {
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
      
      const result = await AppointmentService.getAppointmentById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('updateAppointment', () => {
    it('should update an appointment', async () => {
      const updates = {
        start_time: '2025-05-01T09:00:00.000Z', // earlier start time
        status: 'rescheduled',
        notes: 'Updated notes'
      };
      
      const result = await AppointmentService.updateAppointment(
        mockAppointmentId,
        updates
      );
      
      expect(result).toHaveProperty('id', mockAppointmentId);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.update).toHaveBeenCalledWith(updates);
      
      const updateMock = fromResult.update as jest.Mock;
      const updateResult = updateMock.mock.results[0].value;
      expect(updateResult.eq).toHaveBeenCalledWith('id', mockAppointmentId);
    });

    it('should throw an error if appointment is not found', async () => {
      // Mock getAppointmentById to return null
      jest.spyOn(AppointmentService, 'getAppointmentById').mockResolvedValue(null);
      
      await expect(
        AppointmentService.updateAppointment(
          'non-existent-id',
          { status: 'cancelled' }
        )
      ).rejects.toThrow(CalendarError);
    });

    it('should validate time range if both start and end times are provided', async () => {
      const updates = {
        start_time: '2025-05-01T12:00:00.000Z', // after end time
        end_time: '2025-05-01T11:00:00.000Z'
      };
      
      await expect(
        AppointmentService.updateAppointment(
          mockAppointmentId,
          updates
        )
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an appointment', async () => {
      const result = await AppointmentService.deleteAppointment(mockAppointmentId);
      
      expect(result).toBe(true);
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.delete).toHaveBeenCalled();
      
      const deleteMock = fromResult.delete as jest.Mock;
      const deleteResult = deleteMock.mock.results[0].value;
      expect(deleteResult.eq).toHaveBeenCalledWith('id', mockAppointmentId);
    });

    it('should throw an error if appointment is not found', async () => {
      // Mock getAppointmentById to return null
      jest.spyOn(AppointmentService, 'getAppointmentById').mockResolvedValue(null);
      
      await expect(
        AppointmentService.deleteAppointment('non-existent-id')
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update an appointment status to cancelled', async () => {
      const result = await AppointmentService.updateAppointmentStatus(
        mockAppointmentId,
        'cancelled'
      );
      
      expect(result).toHaveProperty('id', mockAppointmentId);
      expect(result).toHaveProperty('status', 'cancelled');
      
      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      
      const fromMock = supabase.from as jest.Mock;
      const fromResult = fromMock.mock.results[0].value;
      expect(fromResult.update).toHaveBeenCalledWith({
        status: 'cancelled'
      });
      
      const updateMock = fromResult.update as jest.Mock;
      const updateResult = updateMock.mock.results[0].value;
      expect(updateResult.eq).toHaveBeenCalledWith('id', mockAppointmentId);
    });

    it('should throw an error if appointment is not found', async () => {
      // Mock getAppointmentById to return null
      jest.spyOn(AppointmentService, 'getAppointmentById').mockResolvedValue(null);
      
      await expect(
        AppointmentService.updateAppointmentStatus('non-existent-id', 'cancelled')
      ).rejects.toThrow(CalendarError);
    });
  });
});