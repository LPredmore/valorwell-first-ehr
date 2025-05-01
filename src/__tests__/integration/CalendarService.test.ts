import { CalendarService } from '../../services/calendar/CalendarService';
import { AvailabilityService } from '../../services/calendar/AvailabilityService';
import { AppointmentService } from '../../services/calendar/AppointmentService';
import { TimeOffService } from '../../services/calendar/TimeOffService';
import { CalendarError } from '../../services/calendar/CalendarErrorHandler';
import { DateTime } from 'luxon';

// Mock dependencies
jest.mock('../../services/calendar/AvailabilityService', () => ({
  AvailabilityService: {
    getAvailability: jest.fn(),
    createAvailability: jest.fn(),
    updateAvailability: jest.fn(),
    deleteAvailability: jest.fn(),
    getAvailabilityById: jest.fn(),
    toCalendarEvent: jest.fn()
  }
}));

jest.mock('../../services/calendar/AppointmentService', () => ({
  AppointmentService: {
    getAppointments: jest.fn(),
    createAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    getAppointmentById: jest.fn(),
    toCalendarEvent: jest.fn()
  }
}));

jest.mock('../../services/calendar/TimeOffService', () => ({
  TimeOffService: {
    getTimeOff: jest.fn(),
    createTimeOff: jest.fn(),
    updateTimeOff: jest.fn(),
    deleteTimeOff: jest.fn(),
    getTimeOffById: jest.fn(),
    toCalendarEvent: jest.fn()
  }
}));

describe('CalendarService Integration', () => {
  const mockClinicianId = 'clinician-123';
  const mockClientId = 'client-123';
  const mockTimeZone = 'America/New_York';
  const mockStartDate = new Date('2025-05-01T00:00:00.000Z');
  const mockEndDate = new Date('2025-05-31T23:59:59.999Z');
  
  // Mock calendar events
  const mockAvailabilityEvent = {
    id: 'availability-123',
    title: 'Availability',
    start: new Date('2025-05-01T10:00:00.000Z'),
    end: new Date('2025-05-01T11:00:00.000Z'),
    allDay: false,
    extendedProps: {
      clinicianId: mockClinicianId,
      eventType: 'availability',
      isAvailability: true
    }
  };
  
  const mockAppointmentEvent = {
    id: 'appointment-123',
    title: 'Initial Consultation',
    start: new Date('2025-05-02T10:00:00.000Z'),
    end: new Date('2025-05-02T11:00:00.000Z'),
    allDay: false,
    extendedProps: {
      clinicianId: mockClinicianId,
      clientId: mockClientId,
      eventType: 'appointment',
      isAvailability: false
    }
  };
  
  const mockTimeOffEvent = {
    id: 'timeoff-123',
    title: 'Time Off',
    start: new Date('2025-05-03T00:00:00.000Z'),
    end: new Date('2025-05-03T23:59:59.999Z'),
    allDay: true,
    extendedProps: {
      clinicianId: mockClinicianId,
      eventType: 'time_off',
      isAvailability: false
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (AvailabilityService.getAvailability as jest.Mock).mockResolvedValue([
      { id: 'availability-123', clinician_id: mockClinicianId }
    ]);
    
    (AppointmentService.getAppointments as jest.Mock).mockResolvedValue([
      { id: 'appointment-123', clinician_id: mockClinicianId, client_id: mockClientId }
    ]);
    
    (TimeOffService.getTimeOff as jest.Mock).mockResolvedValue([
      { id: 'timeoff-123', clinician_id: mockClinicianId }
    ]);
    
    (AvailabilityService.toCalendarEvent as jest.Mock).mockReturnValue(mockAvailabilityEvent);
    (AppointmentService.toCalendarEvent as jest.Mock).mockReturnValue(mockAppointmentEvent);
    (TimeOffService.toCalendarEvent as jest.Mock).mockReturnValue(mockTimeOffEvent);
    
    (AvailabilityService.createAvailability as jest.Mock).mockResolvedValue({ id: 'availability-123' });
    (AppointmentService.createAppointment as jest.Mock).mockResolvedValue({ id: 'appointment-123' });
    (TimeOffService.createTimeOff as jest.Mock).mockResolvedValue({ id: 'timeoff-123' });
    
    (AvailabilityService.updateAvailability as jest.Mock).mockResolvedValue({ id: 'availability-123' });
    (AppointmentService.updateAppointment as jest.Mock).mockResolvedValue({ id: 'appointment-123' });
    (TimeOffService.updateTimeOff as jest.Mock).mockResolvedValue({ id: 'timeoff-123' });
    
    (AvailabilityService.deleteAvailability as jest.Mock).mockResolvedValue(true);
    (AppointmentService.deleteAppointment as jest.Mock).mockResolvedValue(true);
    (TimeOffService.deleteTimeOff as jest.Mock).mockResolvedValue(true);
  });

  describe('getEvents', () => {
    it('should get all types of events for a clinician', async () => {
      const result = await CalendarService.getEvents(
        mockClinicianId,
        mockTimeZone,
        mockStartDate,
        mockEndDate
      );
      
      expect(result).toHaveLength(3); // Availability, appointment, and time off
      
      // Verify service calls
      expect(AvailabilityService.getAvailability).toHaveBeenCalledWith(
        mockClinicianId,
        mockTimeZone,
        mockStartDate,
        mockEndDate
      );
      
      expect(AppointmentService.getAppointments).toHaveBeenCalledWith(
        mockClinicianId,
        mockTimeZone,
        mockStartDate,
        mockEndDate
      );
      
      expect(TimeOffService.getTimeOff).toHaveBeenCalledWith(
        mockClinicianId,
        mockTimeZone,
        mockStartDate,
        mockEndDate
      );
    });

    it('should handle errors from individual services', async () => {
      // Mock one service to throw an error
      (AppointmentService.getAppointments as jest.Mock).mockRejectedValue(
        new Error('Failed to get appointments')
      );
      
      const result = await CalendarService.getEvents(
        mockClinicianId,
        mockTimeZone,
        mockStartDate,
        mockEndDate
      );
      
      // Should still return availability and time off events
      expect(result).toHaveLength(2);
      
      // Verify service calls
      expect(AvailabilityService.getAvailability).toHaveBeenCalled();
      expect(AppointmentService.getAppointments).toHaveBeenCalled();
      expect(TimeOffService.getTimeOff).toHaveBeenCalled();
    });
  });

  describe('createEvent', () => {
    it('should create an availability event', async () => {
      const event = {
        ...mockAvailabilityEvent,
        id: undefined // New event doesn't have an ID yet
      };
      
      const result = await CalendarService.createEvent(event, mockTimeZone);
      
      expect(result).toHaveProperty('id', 'availability-123');
      
      // Verify service call
      expect(AvailabilityService.createAvailability).toHaveBeenCalled();
      expect(AppointmentService.createAppointment).not.toHaveBeenCalled();
      expect(TimeOffService.createTimeOff).not.toHaveBeenCalled();
    });

    it('should create an appointment event', async () => {
      const event = {
        ...mockAppointmentEvent,
        id: undefined // New event doesn't have an ID yet
      };
      
      const result = await CalendarService.createEvent(event, mockTimeZone);
      
      expect(result).toHaveProperty('id', 'appointment-123');
      
      // Verify service call
      expect(AvailabilityService.createAvailability).not.toHaveBeenCalled();
      expect(AppointmentService.createAppointment).toHaveBeenCalled();
      expect(TimeOffService.createTimeOff).not.toHaveBeenCalled();
    });

    it('should create a time off event', async () => {
      const event = {
        ...mockTimeOffEvent,
        id: undefined // New event doesn't have an ID yet
      };
      
      const result = await CalendarService.createEvent(event, mockTimeZone);
      
      expect(result).toHaveProperty('id', 'timeoff-123');
      
      // Verify service call
      expect(AvailabilityService.createAvailability).not.toHaveBeenCalled();
      expect(AppointmentService.createAppointment).not.toHaveBeenCalled();
      expect(TimeOffService.createTimeOff).toHaveBeenCalled();
    });

    it('should throw an error for unknown event type', async () => {
      const event = {
        id: undefined,
        title: 'Unknown Event',
        start: new Date(),
        end: new Date(),
        extendedProps: {
          eventType: 'unknown' // Invalid event type
        }
      };
      
      await expect(
        CalendarService.createEvent(event as any, mockTimeZone)
      ).rejects.toThrow();
    });
  });

  describe('updateEvent', () => {
    it('should update an availability event', async () => {
      const result = await CalendarService.updateEvent(mockAvailabilityEvent, mockTimeZone);
      
      expect(result).toHaveProperty('id', 'availability-123');
      
      // Verify service call
      expect(AvailabilityService.updateAvailability).toHaveBeenCalled();
      expect(AppointmentService.updateAppointment).not.toHaveBeenCalled();
      expect(TimeOffService.updateTimeOff).not.toHaveBeenCalled();
    });

    it('should update an appointment event', async () => {
      const result = await CalendarService.updateEvent(mockAppointmentEvent, mockTimeZone);
      
      expect(result).toHaveProperty('id', 'appointment-123');
      
      // Verify service call
      expect(AvailabilityService.updateAvailability).not.toHaveBeenCalled();
      expect(AppointmentService.updateAppointment).toHaveBeenCalled();
      expect(TimeOffService.updateTimeOff).not.toHaveBeenCalled();
    });

    it('should update a time off event', async () => {
      const result = await CalendarService.updateEvent(mockTimeOffEvent, mockTimeZone);
      
      expect(result).toHaveProperty('id', 'timeoff-123');
      
      // Verify service call
      expect(AvailabilityService.updateAvailability).not.toHaveBeenCalled();
      expect(AppointmentService.updateAppointment).not.toHaveBeenCalled();
      expect(TimeOffService.updateTimeOff).toHaveBeenCalled();
    });

    it('should throw an error for unknown event type', async () => {
      const event = {
        id: 'unknown-123',
        title: 'Unknown Event',
        start: new Date(),
        end: new Date(),
        extendedProps: {
          eventType: 'unknown' // Invalid event type
        }
      };
      
      await expect(
        CalendarService.updateEvent(event as any, mockTimeZone)
      ).rejects.toThrow();
    });
  });

  describe('deleteEvent', () => {
    it('should delete an availability event', async () => {
      const result = await CalendarService.deleteEvent('availability-123', 'availability');
      
      expect(result).toBe(true);
      
      // Verify service call
      expect(AvailabilityService.deleteAvailability).toHaveBeenCalledWith('availability-123');
      expect(AppointmentService.deleteAppointment).not.toHaveBeenCalled();
      expect(TimeOffService.deleteTimeOff).not.toHaveBeenCalled();
    });

    it('should delete an appointment event', async () => {
      const result = await CalendarService.deleteEvent('appointment-123', 'appointment');
      
      expect(result).toBe(true);
      
      // Verify service call
      expect(AvailabilityService.deleteAvailability).not.toHaveBeenCalled();
      expect(AppointmentService.deleteAppointment).toHaveBeenCalledWith('appointment-123');
      expect(TimeOffService.deleteTimeOff).not.toHaveBeenCalled();
    });

    it('should delete a time off event', async () => {
      const result = await CalendarService.deleteEvent('timeoff-123', 'time_off');
      
      expect(result).toBe(true);
      
      // Verify service call
      expect(AvailabilityService.deleteAvailability).not.toHaveBeenCalled();
      expect(AppointmentService.deleteAppointment).not.toHaveBeenCalled();
      expect(TimeOffService.deleteTimeOff).toHaveBeenCalledWith('timeoff-123');
    });

    it('should throw an error for unknown event type', async () => {
      await expect(
        CalendarService.deleteEvent('unknown-123', 'unknown' as any)
      ).rejects.toThrow();
    });
  });
});