
import { EventApi, ViewApi } from '@fullcalendar/core';

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | string;
export type CalendarEventType = 'appointment' | 'availability' | 'time_off' | 'general' | string;

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  url?: string;
  classNames?: string[];
  editable?: boolean;
  startEditable?: boolean;
  durationEditable?: boolean;
  resourceEditable?: boolean;
  display?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    clinicianId?: string;
    clientId?: string;
    eventType?: CalendarEventType;
    description?: string;
    isAvailability?: boolean;
    isRecurring?: boolean;
    recurrenceId?: string;
    sourceTable?: string;
    status?: string;
    dayOfWeek?: string;
    isActive?: boolean;
  };
}

export interface AppointmentType {
  id: string;
  clientId: string;
  clinicianId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
  sourceTimeZone?: string;
  appointmentDatetime?: string;
  appointmentEndDatetime?: string;
}

export interface RecurrenceRule {
  id: string;
  eventId: string;
  rrule: string;
}

export interface CalendarException {
  id: string;
  recurrenceEventId: string;
  exceptionDate: string;
  isCancelled: boolean;
  replacementEventId?: string;
}

export interface FullCalendarProps {
  clinicianId: string | null;
  userTimeZone: string;
  onEventClick?: (info: any) => void;
  onDateSelect?: (info: any) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  view?: CalendarViewType;
  height?: string | number;
  showAvailability?: boolean;
  onAvailabilityClick?: (event: EventApi) => void;
}
