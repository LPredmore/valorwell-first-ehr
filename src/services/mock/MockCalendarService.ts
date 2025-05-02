
import { DateTime } from 'luxon';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';

/**
 * Mock calendar service that replaces database interactions with local storage
 * This allows us to maintain calendar functionality without database dependencies
 */
class MockCalendarService {
  private storageKey = 'mock_calendar_events';
  
  /**
   * Get all calendar events
   */
  async getAllEvents(clinicianId: string, timezone: string): Promise<CalendarEvent[]> {
    const events = this.getEventsFromStorage();
    return events
      .filter(event => event.extendedProps?.clinicianId === clinicianId)
      .map(event => this.convertEventToTimeZone(event, timezone));
  }

  /**
   * Get events in a specific date range
   */
  async getEventsInRange(
    clinicianId: string,
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    
    const events = this.getEventsFromStorage();
    return events
      .filter(event => {
        // Filter by clinician ID
        if (event.extendedProps?.clinicianId !== clinicianId) return false;
        
        // Convert event dates to DateTime objects for comparison
        const eventStart = this.parseDate(event.start);
        const eventEnd = this.parseDate(event.end);
        
        // Check if the event overlaps with the specified range
        return eventStart < end && eventEnd > start;
      })
      .map(event => this.convertEventToTimeZone(event, timezone));
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(
    clinicianId: string,
    date: Date | string,
    timezone: string
  ): Promise<CalendarEvent[]> {
    const targetDate = this.parseDate(date);
    const nextDay = DateTime.fromJSDate(targetDate.toJSDate()).plus({ days: 1 });
    
    return this.getEventsInRange(
      clinicianId,
      targetDate.toJSDate(),
      nextDay.toJSDate(),
      timezone
    );
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      const events = this.getEventsFromStorage();
      
      // Generate a new ID if not provided
      const newEvent: CalendarEvent = {
        ...event,
        id: event.id || this.generateId(),
        extendedProps: {
          ...event.extendedProps,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
      
      // Add to storage
      events.push(newEvent);
      this.saveEventsToStorage(events);
      
      return this.convertEventToTimeZone(newEvent, timezone);
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(event: CalendarEvent, timezone: string): Promise<CalendarEvent | null> {
    try {
      if (!event.id) {
        throw new Error('Event ID is required for updates');
      }
      
      const events = this.getEventsFromStorage();
      const index = events.findIndex(e => e.id === event.id);
      
      if (index === -1) {
        throw new Error(`Event with ID ${event.id} not found`);
      }
      
      // Update the event
      const updatedEvent: CalendarEvent = {
        ...event,
        extendedProps: {
          ...event.extendedProps,
          updatedAt: new Date().toISOString(),
        }
      };
      
      events[index] = updatedEvent;
      this.saveEventsToStorage(events);
      
      return this.convertEventToTimeZone(updatedEvent, timezone);
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const events = this.getEventsFromStorage();
      const filteredEvents = events.filter(event => event.id !== eventId);
      
      if (filteredEvents.length === events.length) {
        return false; // No event was deleted
      }
      
      this.saveEventsToStorage(filteredEvents);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  /**
   * Generate sample events for a clinician (used for initial data)
   */
  generateSampleEvents(clinicianId: string, count: number = 5): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const now = DateTime.now();
    const eventTypes: CalendarEventType[] = ['appointment', 'availability', 'time_off'];
    const colors = {
      appointment: { backgroundColor: '#a855f7', borderColor: '#9333ea', textColor: '#ffffff' },
      availability: { backgroundColor: '#22c55e', borderColor: '#16a34a', textColor: '#ffffff' },
      time_off: { backgroundColor: '#f97316', borderColor: '#ea580c', textColor: '#ffffff' }
    };
    
    // Generate events for the next 7 days
    for (let i = 0; i < count; i++) {
      const dayOffset = Math.floor(Math.random() * 7);
      const hourOffset = Math.floor(Math.random() * 8);
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const startTime = now
        .plus({ days: dayOffset })
        .set({ hour: 9 + hourOffset, minute: 0, second: 0, millisecond: 0 });
        
      const endTime = startTime.plus({ hours: 1 });
      
      const event: CalendarEvent = {
        id: this.generateId(),
        title: eventType === 'appointment' ? 'Client Appointment' :
               eventType === 'availability' ? 'Available' : 'Time Off',
        start: startTime.toJSDate(),
        end: endTime.toJSDate(),
        ...(colors[eventType] || {}),
        extendedProps: {
          clinicianId,
          eventType,
          isAvailability: eventType === 'availability',
          description: `Sample ${eventType}`,
          timezone: 'America/Chicago',
          createdAt: now.toISO(),
          updatedAt: now.toISO(),
        }
      };
      
      events.push(event);
    }
    
    return events;
  }

  /**
   * Populate storage with sample data if empty
   */
  initializeSampleData(clinicianId: string): void {
    const events = this.getEventsFromStorage();
    
    // Only initialize if storage is empty
    if (events.length === 0) {
      const sampleEvents = this.generateSampleEvents(clinicianId);
      this.saveEventsToStorage(sampleEvents);
    }
  }

  // Helper methods

  /**
   * Get events from local storage
   */
  private getEventsFromStorage(): CalendarEvent[] {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error getting events from storage:', error);
      return [];
    }
  }

  /**
   * Save events to local storage
   */
  private saveEventsToStorage(events: CalendarEvent[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events to storage:', error);
    }
  }

  /**
   * Convert a date to a DateTime object
   */
  private parseDate(date: Date | string): DateTime {
    if (date instanceof Date) {
      return DateTime.fromJSDate(date);
    }
    return DateTime.fromISO(date);
  }

  /**
   * Convert an event to the specified timezone
   */
  private convertEventToTimeZone(event: CalendarEvent, timezone: string): CalendarEvent {
    return TimeZoneService.convertEventToUserTimeZone(event, timezone);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Format error for consistent error handling
   */
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

export const mockCalendarService = new MockCalendarService();
export default mockCalendarService;
