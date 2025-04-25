
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

/**
 * Get event color based on event type
 */
export const getEventColor = (eventType: CalendarEventType): { 
  backgroundColor: string; 
  borderColor: string;
  textColor: string;
} => {
  switch (eventType) {
    case 'appointment':
      return {
        backgroundColor: '#a855f7', // Purple
        borderColor: '#9333ea',
        textColor: '#ffffff'
      };
    case 'availability':
      return {
        backgroundColor: '#22c55e', // Green
        borderColor: '#16a34a',
        textColor: '#ffffff'
      };
    case 'time_off':
      return {
        backgroundColor: '#f97316', // Orange
        borderColor: '#ea580c',
        textColor: '#ffffff'
      };
    default:
      return {
        backgroundColor: '#3b82f6', // Blue
        borderColor: '#2563eb',
        textColor: '#ffffff'
      };
  }
};

/**
 * Format event time for display in calendar
 */
export const formatEventTimeForDisplay = (
  start: Date | string, 
  end: Date | string, 
  timezone: string,
  includeDate = false
): string => {
  try {
    const format = includeDate ? 'EEE, MMM d • h:mm a' : 'h:mm a';
    const startDateTime = typeof start === 'string' 
      ? TimeZoneService.parseWithZone(start, timezone)
      : DateTime.fromJSDate(start).setZone(timezone);
    
    const endDateTime = typeof end === 'string'
      ? TimeZoneService.parseWithZone(end, timezone)
      : DateTime.fromJSDate(end).setZone(timezone);
      
    return `${startDateTime.toFormat(format)} - ${endDateTime.toFormat('h:mm a')}`;
  } catch (error) {
    console.error('Error formatting event time:', error);
    return 'Invalid time';
  }
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'missed':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Create a default new event
 */
export const createDefaultEvent = (
  clinicianId: string, 
  startTime: Date | string,
  endTime: Date | string,
  timezone: string,
  eventType: CalendarEventType = 'appointment'
): CalendarEvent => {
  // Ensure dates are DateTime objects
  const start = typeof startTime === 'string' 
    ? TimeZoneService.parseWithZone(startTime, timezone).toJSDate()
    : startTime;
    
  const end = typeof endTime === 'string'
    ? TimeZoneService.parseWithZone(endTime, timezone).toJSDate()
    : endTime;

  const colors = getEventColor(eventType);
  
  return {
    title: eventType === 'appointment' ? 'New Appointment' : 
           eventType === 'availability' ? 'Available' : 
           eventType === 'time_off' ? 'Time Off' : 'Event',
    start,
    end,
    allDay: false,
    ...colors,
    extendedProps: {
      clinicianId,
      eventType,
      isAvailability: eventType === 'availability',
      timezone
    }
  };
};
