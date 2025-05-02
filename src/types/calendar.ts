
import { EventApi, ViewApi } from '@fullcalendar/core';

// Calendar view types
export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Calendar event types
export type CalendarEventType = 'appointment' | 'availability' | 'time_off' | 'general' | string;

// Weekday numbers (0 = Sunday, 6 = Saturday)
export type WeekdayNumbers = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Day of week strings
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// Props for the FullCalendar component
export interface FullCalendarProps {
  clinicianId: string;
  userTimeZone: string;
  view?: CalendarViewType;
  height?: string | number;
  showAvailability?: boolean;
  onAvailabilityClick?: (event: any) => void;
  testEvents?: CalendarEvent[]; // For performance testing
}

// Unified Calendar Event interface
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
    sourceInfo?: string;
    status?: string;
    dayOfWeek?: string;
    isActive?: boolean;
    timezone?: string;
    sourceTimeZone?: string;
    originalSlotId?: string;
    googleEventId?: string;
    week?: number;
    appointment?: any;
    displayStart?: string;
    displayEnd?: string;
    displayDay?: string;
    displayDate?: string;
    clientName?: string;
    clinicianName?: string;
    _userTimeZone?: string;
    [key: string]: any;
  };
  // For backward compatibility
  clinician_id?: string;
  type?: string;
  description?: string;
  location?: string;
  color?: string;
  _userTimeZone?: string;
  [key: string]: any;
}

// Availability slot interface
export interface AvailabilitySlot {
  id: string;
  clinicianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  isRecurring: boolean;
  isAppointment: boolean;
  [key: string]: any;
}
