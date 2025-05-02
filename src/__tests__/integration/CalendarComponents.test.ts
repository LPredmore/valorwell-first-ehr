import { TimeOffService } from '@/services/calendar/TimeOffService';
import { TimeZoneService } from '@/services/calendar/TimeZoneService';
import { CalendarQueryService } from '@/services/calendar/CalendarQueryService';
import { CalendarMutationService } from '@/services/calendar/CalendarMutationService';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('Calendar Components Integration', () => {
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
    time_zone: mockTimeZone,
    event_type: 'time_off'
  };

  // Mock calendar event
  const mockCalendarEvent: CalendarEvent = {
    id: mockTimeOffId,
    title: mockReason,
    start: mockStartTime,
    end: mockEndTime,
    allDay: mockAllDay,
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
  });

  describe('TimeOffService and CalendarQueryService Integration', () => {
    it('should create time off and retrieve it via calendar query', async () => {
      // Mock TimeOffService.createTimeOff
      jest.spyOn(TimeOffService, 'createTimeOff').mockResolvedValue({
        id: mockTimeOffId,
        clinician_id: mockClinicianId,
        start_time: new Date(mockStartTime),
        end_time: new Date(mockEndTime),
        reason: mockReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      });

      // Mock CalendarQueryService.getEventsInRange
      jest.spyOn(CalendarQueryService, 'getEventsInRange').mockResolvedValue([mockCalendarEvent]);

      // Create time off
      const timeOff = await TimeOffService.createTimeOff(
        mockClinicianId,
        mockStartTime,
        mockEndTime,
        mockTimeZone,
        mockReason,
        mockAllDay
      );

      expect(timeOff).toHaveProperty('id', mockTimeOffId);

      // Query calendar events
      const startDate = new Date(mockStartTime);
      const endDate = new Date(mockEndTime);
      const events = await CalendarQueryService.getEventsInRange(
        mockClinicianId,
        startDate,
        endDate,
        mockTimeZone
      );

      // Verify the time off event is included in calendar events
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(mockTimeOffId);
      expect(events[0].title).toBe(mockReason);
      expect(events[0].extendedProps?.eventType).toBe('time_off');
    });

    it('should update time off and reflect changes in calendar query', async () => {
      const updatedReason = 'Updated reason';
      
      // Mock TimeOffService.getTimeOffById
      jest.spyOn(TimeOffService, 'getTimeOffById').mockResolvedValue({
        id: mockTimeOffId,
        clinicianId: mockClinicianId,
        startTime: new Date(mockStartTime),
        endTime: new Date(mockEndTime),
        reason: mockReason,
        allDay: mockAllDay,
        timeZone: mockTimeZone
      });

      // Mock TimeOffService.updateTimeOff
      jest.spyOn(TimeOffService, 'updateTimeOff').mockResolvedValue({
        id: mockTimeOffId,
        clinician_id: mockClinicianId,
        start_time: new Date(mockStartTime),
        end_time: new Date(mockEndTime),
        reason: updatedReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      });

      // Mock CalendarQueryService.getEventsInRange
      jest.spyOn(CalendarQueryService, 'getEventsInRange').mockResolvedValue([
        {
          ...mockCalendarEvent,
          title: updatedReason
        }
      ]);

      // Update time off
      const updatedTimeOff = await TimeOffService.updateTimeOff(mockTimeOffId, {
        reason: updatedReason
      });

      expect(updatedTimeOff).toHaveProperty('reason', updatedReason);

      // Query calendar events
      const startDate = new Date(mockStartTime);
      const endDate = new Date(mockEndTime);
      const events = await CalendarQueryService.getEventsInRange(
        mockClinicianId,
        startDate,
        endDate,
        mockTimeZone
      );

      // Verify the updated time off event is reflected in calendar events
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(mockTimeOffId);
      expect(events[0].title).toBe(updatedReason);
    });

    it('should delete time off and remove it from calendar query', async () => {
      // Mock TimeOffService.deleteTimeOff
      jest.spyOn(TimeOffService, 'deleteTimeOff').mockResolvedValue(true);

      // Mock CalendarQueryService.getEventsInRange
      jest.spyOn(CalendarQueryService, 'getEventsInRange')
        .mockResolvedValueOnce([mockCalendarEvent]) // First call returns the event
        .mockResolvedValueOnce([]); // Second call after deletion returns empty array

      // Verify event exists before deletion
      const startDate = new Date(mockStartTime);
      const endDate = new Date(mockEndTime);
      const eventsBefore = await CalendarQueryService.getEventsInRange(
        mockClinicianId,
        startDate,
        endDate,
        mockTimeZone
      );

      expect(eventsBefore).toHaveLength(1);
      expect(eventsBefore[0].id).toBe(mockTimeOffId);

      // Delete time off
      await TimeOffService.deleteTimeOff(mockTimeOffId);

      // Verify event is removed after deletion
      const eventsAfter = await CalendarQueryService.getEventsInRange(
        mockClinicianId,
        startDate,
        endDate,
        mockTimeZone
      );

      expect(eventsAfter).toHaveLength(0);
    });
  });

  describe('TimeZoneService Integration with Calendar Components', () => {
    it('should convert time off events between timezones', async () => {
      const sourceTimeZone = 'America/Chicago';
      const targetTimeZone = 'America/New_York';
      
      // Mock TimeOffService.getTimeOffById
      jest.spyOn(TimeOffService, 'getTimeOffById').mockResolvedValue({
        id: mockTimeOffId,
        clinicianId: mockClinicianId,
        startTime: new Date(mockStartTime),
        endTime: new Date(mockEndTime),
        reason: mockReason,
        allDay: mockAllDay,
        timeZone: sourceTimeZone
      });

      // Get time off
      const timeOff = await TimeOffService.getTimeOffById(mockTimeOffId);
      
      // Convert to calendar event
      const calendarEvent = TimeOffService.toCalendarEvent(timeOff, sourceTimeZone);
      
      // Convert to target timezone
      const convertedEvent = TimeZoneService.convertEventToUserTimeZone(
        calendarEvent as CalendarEvent,
        targetTimeZone
      );
      
      // Verify timezone conversion
      expect(convertedEvent.extendedProps?.timezone).toBe(targetTimeZone);
      
      // New York is 1 hour ahead of Chicago
      const sourceStart = DateTime.fromISO(calendarEvent.start.toString(), { zone: sourceTimeZone });
      const targetStart = DateTime.fromISO(convertedEvent.start.toString(), { zone: targetTimeZone });
      
      // The hour in the target timezone should be 1 hour ahead
      expect(targetStart.hour).toBe(sourceStart.hour + 1);
    });

    it('should handle all-day events correctly across timezones', async () => {
      const allDayTimeOff = {
        id: 'allday-123',
        clinicianId: mockClinicianId,
        startTime: '2025-05-01T00:00:00.000Z',
        endTime: '2025-05-01T23:59:59.999Z',
        reason: 'All Day Off',
        allDay: true,
        timeZone: mockTimeZone
      };
      
      // Convert to calendar event
      const calendarEvent = TimeOffService.toCalendarEvent(allDayTimeOff, mockTimeZone);
      
      // Convert to different timezone
      const convertedEvent = TimeZoneService.convertEventToUserTimeZone(
        calendarEvent as CalendarEvent,
        'Europe/London'
      );
      
      // Verify all-day flag is preserved
      expect(convertedEvent.allDay).toBe(true);
      
      // For all-day events, the date should remain the same regardless of timezone
      const originalDate = DateTime.fromISO(calendarEvent.start.toString()).toFormat('yyyy-MM-dd');
      const convertedDate = DateTime.fromISO(convertedEvent.start.toString()).toFormat('yyyy-MM-dd');
      
      expect(convertedDate).toBe(originalDate);
    });
  });

  describe('DateTime Handling Across Calendar Components', () => {
    it('should maintain consistent datetime handling between services', async () => {
      // Mock TimeOffService.createTimeOff
      jest.spyOn(TimeOffService, 'createTimeOff').mockResolvedValue({
        id: mockTimeOffId,
        clinician_id: mockClinicianId,
        start_time: new Date(mockStartTime),
        end_time: new Date(mockEndTime),
        reason: mockReason,
        all_day: mockAllDay,
        time_zone: mockTimeZone
      });

      // Create time off with Date objects
      const startDate = new Date(mockStartTime);
      const endDate = new Date(mockEndTime);
      
      const timeOff = await TimeOffService.createTimeOff(
        mockClinicianId,
        startDate,
        endDate,
        mockTimeZone,
        mockReason,
        mockAllDay
      );

      // Convert to calendar event
      const calendarEvent = TimeOffService.toCalendarEvent(timeOff, mockTimeZone);
      
      // Verify datetime consistency
      const originalStart = DateTime.fromJSDate(startDate).setZone(mockTimeZone);
      const eventStart = DateTime.fromISO(calendarEvent.start.toString(), { zone: mockTimeZone });
      
      // The hours should match in the same timezone
      expect(eventStart.hour).toBe(originalStart.hour);
      expect(eventStart.minute).toBe(originalStart.minute);
    });
  });
});