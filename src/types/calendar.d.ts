
import { EventInput } from '@fullcalendar/core';
import { AppointmentType } from './appointment';

// Centralized view type definition
export type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

// Event types
export type CalendarEventType = 'appointment' | 'time_off';

// Recurring rule format (iCalendar RRULE)
export interface RecurrenceRule {
  id?: string;
  eventId: string;
  rrule: string;
}

// Exception to a recurring event
export interface CalendarException {
  id?: string;
  recurrenceEventId: string;
  exceptionDate: string;
  isCancelled: boolean;
  replacementEventId?: string;
}

// Base calendar event format
export interface ICalendarEvent {
  id: string;
  clinicianId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  eventType: CalendarEventType;
  recurrenceId?: string;
  recurrenceRule?: RecurrenceRule;
  exceptions?: CalendarException[];
  googleEventId?: string;
}

// Extended properties for FullCalendar compatibility
export interface CalendarEvent extends EventInput {
  extendedProps?: {
    appointment?: AppointmentType;
    eventType?: CalendarEventType;
    recurrenceRule?: RecurrenceRule;
    exceptions?: CalendarException[];
    isException?: boolean;
    googleEventId?: string;
    description?: string;
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
}
