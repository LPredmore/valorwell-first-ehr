import { EventApi, ViewApi } from '@fullcalendar/core';

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | string;
export type CalendarEventType = 'appointment' | 'availability' | 'time_off' | 'general' | string;
export type WeekdayNumbers = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FullCalendarProps {
  clinicianId: string;
  userTimeZone: string;
  view?: CalendarViewType;
  height?: string | number;
  showAvailability?: boolean;
  onAvailabilityClick?: (event: any) => void;
}

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
    timezone?: string;
    originalSlotId?: string;
    googleEventId?: string;
    week?: number;
    appointment?: any;
  };
  clinician_id?: string;
  type?: string;
  description?: string;
  location?: string;
  _userTimeZone?: string;
}
