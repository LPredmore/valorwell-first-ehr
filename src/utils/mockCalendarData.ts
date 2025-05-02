
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { DateTime } from 'luxon';

/**
 * Generate mock calendar events for testing or when database is unavailable
 */
export const generateMockCalendarEvents = (
  clinicianId: string, 
  eventCount: number = 10,
  timezone: string = 'UTC',
  startDate?: Date,
  endDate?: Date
): CalendarEvent[] => {
  // Default date range to current month if not specified
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  const startDateTime = DateTime.fromJSDate(start);
  const endDateTime = DateTime.fromJSDate(end);
  const totalDays = endDateTime.diff(startDateTime, 'days').days;

  const result: CalendarEvent[] = [];
  const eventTypes: CalendarEventType[] = ['appointment', 'availability', 'time_off'];
  
  // Generate random events
  for (let i = 0; i < eventCount; i++) {
    // Pick a random day within the range
    const randomDayOffset = Math.floor(Math.random() * totalDays);
    const eventDay = startDateTime.plus({ days: randomDayOffset });
    
    // Random hour between 8 AM and 6 PM
    const hour = 8 + Math.floor(Math.random() * 10);
    const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45
    
    // Create event start and end times
    const eventStartDateTime = eventDay.set({ hour, minute });
    const durationHours = Math.floor(Math.random() * 3) + 1; // 1-3 hours
    const eventEndDateTime = eventStartDateTime.plus({ hours: durationHours });
    
    // Pick a random event type
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Generate a mock event
    const event: CalendarEvent = {
      id: `mock-${i}-${eventStartDateTime.toMillis()}`,
      title: getEventTitle(eventType),
      start: eventStartDateTime.toJSDate(),
      end: eventEndDateTime.toJSDate(),
      backgroundColor: getEventColor(eventType),
      borderColor: getEventColor(eventType),
      textColor: '#ffffff',
      extendedProps: {
        eventType,
        clinicianId,
        sourceTimeZone: timezone,
        displayStart: eventStartDateTime.toFormat('h:mm a'),
        displayEnd: eventEndDateTime.toFormat('h:mm a'),
        displayDay: eventStartDateTime.toFormat('cccc'),
        displayDate: eventStartDateTime.toFormat('MMM d, yyyy'),
      }
    };
    
    // Add appointment-specific properties
    if (eventType === 'appointment') {
      event.extendedProps!.clientId = `mock-client-${Math.floor(Math.random() * 1000)}`;
      event.extendedProps!.clientName = getRandomName();
      event.extendedProps!.status = getRandomStatus();
    }
    
    result.push(event);
  }
  
  return result;
};

// Helper functions
function getEventTitle(eventType: CalendarEventType): string {
  switch (eventType) {
    case 'appointment':
      return `Appointment with ${getRandomName()}`;
    case 'availability':
      return 'Available';
    case 'time_off':
      return 'Time Off';
    default:
      return 'Calendar Event';
  }
}

function getEventColor(eventType: CalendarEventType): string {
  switch (eventType) {
    case 'appointment':
      return '#4f46e5'; // Indigo
    case 'availability':
      return '#10b981'; // Green
    case 'time_off':
      return '#f59e0b'; // Amber
    default:
      return '#6b7280'; // Gray
  }
}

function getRandomName(): string {
  const firstNames = ['James', 'Emma', 'Michael', 'Sarah', 'John', 'Olivia', 'David', 'Sophia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

function getRandomStatus(): string {
  const statuses = ['confirmed', 'pending', 'cancelled', 'completed'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export default generateMockCalendarEvents;
