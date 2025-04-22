import { EventInput } from '@fullcalendar/core';
import { AppointmentType } from './appointment';

export type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";
export type CalendarEventType = 'appointment' | 'time_off' | 'availability';

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
