
import { EventContentArg, EventApi, ViewApi } from '@fullcalendar/core';
import { CalendarEvent } from './calendar';

// Extended event content interface that properly extends EventContentArg
export interface FullCalendarEventContent extends Omit<EventContentArg, 'event' | 'view'> {
  event: EventApi & {
    extendedProps?: {
      isAvailability?: boolean;
      isRecurring?: boolean;
      originalSlotId?: string;
      dayOfWeek?: string;
      eventType?: string;
      timezone?: string;
      is_active?: boolean;
      googleEventId?: string;
      week?: number;
      recurrenceId?: string;
      sourceTable?: string;
      status?: string;
      clientId?: string;
      clinicianId?: string;
      appointment?: any;
    };
    title: string;
  };
  timeText: string;
  view: {
    type: string;
  };
}

// Add additional interfaces for Google Calendar integration
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  recurrence?: string[];
  status: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

export interface GoogleCalendarSyncResult {
  added: number;
  updated: number;
  deleted: number;
  errors: number;
  events: GoogleCalendarEvent[];
}
