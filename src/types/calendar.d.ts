
import { EventInput } from '@fullcalendar/core';
import { AppointmentType } from './appointment';

// Centralized view type definition
export type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

// iCalendar event types
export type CalendarEventType = 'availability' | 'appointment' | 'time_off';

// Recurring rule format (iCalendar RRULE)
export interface RecurrenceRule {
  id?: string;
  eventId: string;
  rrule: string; // Standard iCalendar RRULE format
}

// Exception to a recurring event
export interface CalendarException {
  id?: string;
  recurrenceEventId: string;
  exceptionDate: string; // ISO date format
  isCancelled: boolean;
  replacementEventId?: string;
}

// Base calendar event format following iCalendar standards
export interface ICalendarEvent {
  id: string;
  clinicianId: string;
  title: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  allDay: boolean;
  eventType: CalendarEventType;
  recurrenceId?: string; // Reference to parent event for instances
  recurrenceRule?: RecurrenceRule; // For recurring events
  exceptions?: CalendarException[]; // List of exceptions
  googleEventId?: string; // ID of the corresponding Google Calendar event
}

// Extended properties for FullCalendar compatibility
export interface CalendarEvent extends EventInput {
  extendedProps?: {
    appointment?: AppointmentType;
    isAvailability?: boolean;
    eventType?: CalendarEventType;
    recurrenceRule?: RecurrenceRule;
    isException?: boolean;
    googleEventId?: string; // ID of the corresponding Google Calendar event
    isGoogleEvent?: boolean; // Whether this event is from Google Calendar
    availabilityBlock?: {
      id: string;
      type: 'weekly' | 'single_day' | 'time_block';
      dayOfWeek?: string;
      date?: string;
      startTime: string;
      endTime: string;
      reason?: string;
    };
  };
}

export interface FullCalendarProps {
  events?: CalendarEvent[];
  clinicianId: string | null;
  onEventClick?: (info: any) => void;
  onDateSelect?: (info: any) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  userTimeZone: string;
  view?: CalendarViewType;
  height?: string | number;
  showAvailability?: boolean;
  showGoogleEvents?: boolean; // Whether to show Google Calendar events
}

// Google Calendar specific types
export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  scope: string;
  discoveryDocs: string[];
}

export interface GoogleCalendarAuth {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: Error | null;
}
