// Types for calendar functionality

import { EventInput } from '@fullcalendar/core';
import { AppointmentType } from './appointment';

// View types for FullCalendar
export type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";
export type CalendarEventType = 'appointment' | 'time_off' | 'availability';

// Update the WeekdayNumbers type to match Luxon's definition (Monday=1, Sunday=7)
export type WeekdayNumbers = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface RecurrenceRuleResult {
  rrule: string;
}

export interface RecurrenceRule {
  id?: string;
  eventId: string;
  rrule: string;
}

export interface CalendarException {
  id?: string;
  recurrenceEventId: string;
  exceptionDate: string;
  isCancelled: boolean;
  replacementEventId?: string;
}

// The type for events returned from the backend and passed to FullCalendar
export interface CalendarEvent extends EventInput {
  extendedProps?: {
    appointment?: AppointmentType;
    eventType?: CalendarEventType;
    recurrenceRule?: RecurrenceRule;
    exceptions?: CalendarException[];
    isException?: boolean;
    googleEventId?: string;
    description?: string;
    isAvailability?: boolean;
    isRecurring?: boolean;
    dayOfWeek?: string;
    originalSlotId?: string;
    eventType?: 'availability';
    week?: number;
    // Add is_active for availability (not needed for appointments, but type-safe)
    is_active?: boolean;
  };
}

// The props for the FullCalendarView React component
export interface FullCalendarProps {
  events?: CalendarEvent[];
  clinicianId: string | null;
  onEventClick?: (info: any) => void;
  onDateSelect?: (info: any) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  onAvailabilityClick?: (event: any) => void;
  userTimeZone: string;
  view?: CalendarViewType;
  height?: string | number;
  showAvailability?: boolean;
}
