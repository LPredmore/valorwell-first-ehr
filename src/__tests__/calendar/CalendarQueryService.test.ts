import { CalendarQueryService } from '@/services/calendar/CalendarQueryService';
import { supabase } from '@/integrations/supabase/client';
import { calendarTransformer } from '@/utils/calendarTransformer';
import { TimeZoneService } from '@/utils/timezone';
import { DatabaseCalendarEvent } from '@/types/calendarTypes';
import { CalendarEvent } from '@/types/calendar';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('@/utils/calendarTransformer', () => ({
  calendarTransformer: {
    fromDatabase: jest.fn()
  }
}));

jest.mock('@/utils/calendarDebugUtils', () => ({
  debugUuidValidation: jest.fn(),
  trackCalendarApi: jest.fn()
}));

describe('CalendarQueryService', () => {
  const mockClinicianId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTimeZone = 'America/Chicago';
  const mockStartDate = new Date('2025-05-01T00:00:00Z');
  const mockEndDate = new Date('2025-05-07T23:59:59Z');
  
  // Mock database response data for different event types
  const mockAvailabilityEvent: DatabaseCalendarEvent = {
    id: '1',
    title: 'Availability',
    start_time: '2025-05-01T09:00:00Z',
    end_time: '2025-05-01T10:00:00Z',
    event_type: 'availability',
    is_active: true,
    clinician_id: mockClinicianId,
    time_zone: mockTimeZone
  };
  
  const mockAppointmentEvent: DatabaseCalendarEvent = {
    id: '2',
    title: 'Therapy Session',
    start_time: '2025-05-02T13:00:00Z',
    end_time: '2025-05-02T14:00:00Z',
    event_type: 'appointment',
    is_active: true,
    clinician_id: mockClinicianId,
    time_zone: mockTimeZone
  };
  
  const mockTimeOffEvent: DatabaseCalendarEvent = {
    id: '3',
    title: 'Vacation',
    start_time: '2025-05-03T00:00:00Z',
    end_time: '2025-05-03T23:59:59Z',
    event_type: 'time_off',
    is_active: true,
    clinician_id: mockClinicianId,
    time_zone: mockTimeZone,
    all_day: true
  };
  
  // Mock transformed calendar events
  const mockTransformedAvailability: CalendarEvent = {
    id: '1',
    title: 'Availability',
    start: '2025-05-01T09:00:00.000-05:00',
    end: '2025-05-01T10:00:00.000-05:00',
    extendedProps: {
      eventType: 'availability',
      clinicianId: mockClinicianId,
      isAvailability: true,
      isActive: true,
      timezone: mockTimeZone
    }
  };
  
  const mockTransformedAppointment: CalendarEvent = {
    id: '2',
    title: 'Therapy Session',
    start: '2025-05-02T13:00:00.000-05:00',
    end: '2025-05-02T14:00:00.000-05:00',
    extendedProps: {
      eventType: 'appointment',
      clinicianId: mockClinicianId,
      isAvailability: false,
      isActive: true,
      timezone: mockTimeZone
    }
  };
  
  const mockTransformedTimeOff: CalendarEvent = {
    id: '3',
    title: 'Vacation',
    start: '2025-05-03T00:00:00.000-05:00',
    end: '2025-05-03T23:59:59.000-05:00',
    allDay: true,
    extendedProps: {
      eventType: 'time_off',
      clinicianId: mockClinicianId,
      isAvailability: false,
      isActive: true,
      timezone: mockTimeZone
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup TimeZoneService mock
    jest.spyOn(TimeZoneService, 'ensureIANATimeZone').mockReturnValue(mockTimeZone);
  });

  describe('getEvents', () => {
    it('should query unified_calendar_view and return transformed events', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent, mockAppointmentEvent, mockTimeOffEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Setup transformer mock
      (calendarTransformer.fromDatabase as jest.Mock)
        .mockReturnValueOnce(mockTransformedAvailability)
        .mockReturnValueOnce(mockTransformedAppointment)
        .mockReturnValueOnce(mockTransformedTimeOff);
      
      // Call the method
      const result = await CalendarQueryService.getEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
      expect(calendarTransformer.fromDatabase).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        mockTransformedAvailability,
        mockTransformedAppointment,
        mockTransformedTimeOff
      ]);
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock Supabase error response
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      const mockResponse = { data: null, error: mockError };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Call the method
      const result = await CalendarQueryService.getEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(result).toEqual([]);
      expect(calendarTransformer.fromDatabase).not.toHaveBeenCalled();
    });
    
    it('should validate clinician ID and return empty array if invalid', async () => {
      // Call the method with invalid ID
      const result = await CalendarQueryService.getEvents('invalid-id', mockTimeZone);
      
      // Assertions
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
  
  describe('getAllEvents', () => {
    it('should query all events for a clinician', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent, mockAppointmentEvent, mockTimeOffEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Setup transformer mock
      (calendarTransformer.fromDatabase as jest.Mock)
        .mockReturnValueOnce(mockTransformedAvailability)
        .mockReturnValueOnce(mockTransformedAppointment)
        .mockReturnValueOnce(mockTransformedTimeOff);
      
      // Call the method
      const result = await CalendarQueryService.getAllEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
      expect(calendarTransformer.fromDatabase).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });
  });
  
  describe('getEventsInRange', () => {
    it('should query events within a specific date range', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent, mockAppointmentEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lte: () => ({
                  eq: () => Promise.resolve(mockResponse)
                })
              })
            })
          })
        } as any;
      });
      
      // Setup transformer mock
      (calendarTransformer.fromDatabase as jest.Mock)
        .mockReturnValueOnce(mockTransformedAvailability)
        .mockReturnValueOnce(mockTransformedAppointment);
      
      // Call the method
      const result = await CalendarQueryService.getEventsInRange(
        mockClinicianId,
        mockStartDate,
        mockEndDate,
        mockTimeZone
      );
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
      expect(calendarTransformer.fromDatabase).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
    
    it('should handle string dates for range parameters', async () => {
      // Mock Supabase response
      const mockData = [mockAppointmentEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lte: () => ({
                  eq: () => Promise.resolve(mockResponse)
                })
              })
            })
          })
        } as any;
      });
      
      // Setup transformer mock
      (calendarTransformer.fromDatabase as jest.Mock)
        .mockReturnValueOnce(mockTransformedAppointment);
      
      // Call the method with string dates
      const result = await CalendarQueryService.getEventsInRange(
        mockClinicianId,
        '2025-05-01T00:00:00Z',
        '2025-05-07T23:59:59Z',
        mockTimeZone
      );
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
      expect(calendarTransformer.fromDatabase).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });
  
  describe('getEventsForDate', () => {
    it('should query events for a specific date', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lte: () => ({
                  eq: () => Promise.resolve(mockResponse)
                })
              })
            })
          })
        } as any;
      });
      
      // Setup transformer mock
      (calendarTransformer.fromDatabase as jest.Mock)
        .mockReturnValueOnce(mockTransformedAvailability);
      
      // Call the method
      const result = await CalendarQueryService.getEventsForDate(
        mockClinicianId,
        mockStartDate,
        mockTimeZone
      );
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
      expect(calendarTransformer.fromDatabase).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTransformedAvailability);
    });
  });
  
  describe('Event type handling', () => {
    it('should correctly transform availability events', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Setup transformer mock to pass through the actual event for inspection
      (calendarTransformer.fromDatabase as jest.Mock).mockImplementation(
        (event: DatabaseCalendarEvent, timezone: string) => ({
          id: event.id,
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          extendedProps: {
            eventType: event.event_type,
            clinicianId: event.clinician_id,
            isAvailability: event.event_type === 'availability',
            timezone
          }
        })
      );
      
      // Call the method
      const result = await CalendarQueryService.getEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0].extendedProps?.eventType).toBe('availability');
      expect(result[0].extendedProps?.isAvailability).toBe(true);
    });
    
    it('should correctly transform appointment events', async () => {
      // Mock Supabase response
      const mockData = [mockAppointmentEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Setup transformer mock to pass through the actual event for inspection
      (calendarTransformer.fromDatabase as jest.Mock).mockImplementation(
        (event: DatabaseCalendarEvent, timezone: string) => ({
          id: event.id,
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          extendedProps: {
            eventType: event.event_type,
            clinicianId: event.clinician_id,
            isAvailability: event.event_type === 'availability',
            timezone
          }
        })
      );
      
      // Call the method
      const result = await CalendarQueryService.getEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0].extendedProps?.eventType).toBe('appointment');
      expect(result[0].extendedProps?.isAvailability).toBe(false);
    });
    
    it('should correctly transform time_off events', async () => {
      // Mock Supabase response
      const mockData = [mockTimeOffEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Setup transformer mock to pass through the actual event for inspection
      (calendarTransformer.fromDatabase as jest.Mock).mockImplementation(
        (event: DatabaseCalendarEvent, timezone: string) => ({
          id: event.id,
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          allDay: event.all_day,
          extendedProps: {
            eventType: event.event_type,
            clinicianId: event.clinician_id,
            isAvailability: event.event_type === 'availability',
            timezone
          }
        })
      );
      
      // Call the method
      const result = await CalendarQueryService.getEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0].extendedProps?.eventType).toBe('time_off');
      expect(result[0].extendedProps?.isAvailability).toBe(false);
      expect(result[0].allDay).toBe(true);
    });
  });
  
  describe('validateClinicianId', () => {
    it('should accept valid UUID format', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Call the method with valid UUID
      await CalendarQueryService.getEvents(mockClinicianId, mockTimeZone);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
    });
    
    it('should attempt to format non-standard UUID formats', async () => {
      // Mock Supabase response
      const mockData = [mockAvailabilityEvent];
      const mockResponse = { data: mockData, error: null };
      
      // Setup mocks
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse)
            })
          })
        } as any;
      });
      
      // Call the method with non-standard UUID format
      const nonStandardUuid = '123e4567e89b12d3a456426614174000'; // No hyphens
      await CalendarQueryService.getEvents(nonStandardUuid, mockTimeZone);
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('unified_calendar_view');
    });
    
    it('should return empty array for null or undefined clinician ID', async () => {
      // Call the method with null
      const result1 = await CalendarQueryService.getEvents(null as any, mockTimeZone);
      
      // Call the method with undefined
      const result2 = await CalendarQueryService.getEvents(undefined as any, mockTimeZone);
      
      // Assertions
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});