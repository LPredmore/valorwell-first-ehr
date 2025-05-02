
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';

/**
 * Generate mock calendar data for testing and development
 */
export const generateMockCalendarEvents = (
  clinicianId: string, 
  count: number = 10,
  timeZone: string = 'America/Chicago',
  startDate?: Date,
  endDate?: Date
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const startDateTime = startDate ? DateTime.fromJSDate(startDate) : DateTime.now().minus({ days: 7 });
  const endDateTime = endDate ? DateTime.fromJSDate(endDate) : DateTime.now().plus({ days: 30 });
  const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
  
  const eventTypes = ['appointment', 'availability', 'time_off'];
  const clientNames = [
    'John Doe', 'Jane Smith', 'Michael Johnson', 'Emma Williams',
    'Robert Brown', 'Olivia Jones', 'William Davis', 'Sophia Miller',
  ];

  // Calculate the number of days in the range
  const daysDiff = endDateTime.diff(startDateTime, 'days').days;
  
  // Generate random events
  for (let i = 0; i < count; i++) {
    // Determine a random day within the range
    const randomDayOffset = Math.floor(Math.random() * daysDiff);
    const randomDay = startDateTime.plus({ days: randomDayOffset });
    
    // Pick a random hour between 8 AM and 5 PM
    const randomHour = 8 + Math.floor(Math.random() * 9); // 8 AM to 5 PM
    
    // Create start and end times (appointments are 1 hour by default)
    const startTime = randomDay.set({
      hour: randomHour,
      minute: 0,
      second: 0,
      millisecond: 0
    }).setZone(validTimeZone);
    
    const endTime = startTime.plus({ hours: 1 });
    
    // Determine event type
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Generate event based on type
    const eventId = `mock-${eventType}-${i}-${Date.now()}`;
    let event: CalendarEvent;
    
    if (eventType === 'appointment') {
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
      const status = Math.random() > 0.9 ? 'cancelled' : 'scheduled';
      
      event = {
        id: eventId,
        title: `${clientName} - Appointment`,
        start: startTime.toJSDate(),
        end: endTime.toJSDate(),
        backgroundColor: status === 'cancelled' ? '#FCA5A5' : '#93C5FD',
        borderColor: status === 'cancelled' ? '#EF4444' : '#3B82F6',
        textColor: '#000000',
        extendedProps: {
          eventType,
          clinicianId,
          clientId: `mock-client-${i}`,
          description: `Session with ${clientName}`,
          status,
          timezone: validTimeZone,
          sourceTimeZone: validTimeZone,
        }
      };
    } else if (eventType === 'availability') {
      event = {
        id: eventId,
        title: 'Available',
        start: startTime.toJSDate(),
        end: endTime.toJSDate(),
        backgroundColor: '#A7F3D0',
        borderColor: '#10B981',
        textColor: '#000000',
        extendedProps: {
          eventType,
          clinicianId,
          isAvailability: true,
          description: 'Available for booking',
          timezone: validTimeZone,
          sourceTimeZone: validTimeZone,
        }
      };
    } else { // time_off
      event = {
        id: eventId,
        title: 'Time Off',
        start: startTime.toJSDate(),
        end: endTime.toJSDate(),
        backgroundColor: '#FDE68A',
        borderColor: '#F59E0B',
        textColor: '#000000',
        extendedProps: {
          eventType,
          clinicianId,
          description: 'Not available',
          timezone: validTimeZone,
          sourceTimeZone: validTimeZone,
        }
      };
    }
    
    events.push(event);
  }
  
  // Convert all events to the specified timezone
  return events.map(event => TimeZoneService.convertEventToUserTimeZone(event, timeZone));
};
