import { EventApi, ViewApi } from '@fullcalendar/core';
import { DateTime } from 'luxon';

/**
 * Calendar view types supported by the application
 */
export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | string;

/**
 * Calendar event types
 */
export type CalendarEventType = 'appointment' | 'availability' | 'time_off' | 'general' | string;

/**
 * Weekday numbers (0 = Sunday, 6 = Saturday)
 */
export type WeekdayNumbers = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Calendar event interface
 * Compatible with FullCalendar's EventInput
 */
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
    recurrenceRule?: string;
    sourceTable?: string;
    sourceInfo?: string;
    status?: string;
    dayOfWeek?: string;
    isActive?: boolean;
    timezone?: string;
    sourceTimeZone?: string;
    displayTimeZone?: string;
    originalSlotId?: string;
    googleEventId?: string;
    week?: number;
    appointment?: any;
    displayStart?: string;
    displayEnd?: string;
    displayDay?: string;
    displayDate?: string;
  };
  clinician_id?: string;
  type?: string;
  description?: string;
  location?: string;
  _userTimeZone?: string;
}

/**
 * Availability block interface
 */
export interface AvailabilityBlock {
  id: string;
  clinicianId: string;
  startTime: string | Date;
  endTime: string | Date;
  availabilityType: 'recurring' | 'single';
  recurrencePatternId?: string;
  isActive: boolean;
  timeZone: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Appointment interface
 */
export interface Appointment {
  id: string;
  clientId: string;
  clinicianId: string;
  startTime: string | Date;
  endTime: string | Date;
  type: string;
  status: 'scheduled' | 'cancelled' | 'completed' | string;
  notes?: string;
  recurrenceGroupId?: string;
  timeZone: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Time off interface
 */
export interface TimeOff {
  id: string;
  clinicianId: string;
  startTime: string | Date;
  endTime: string | Date;
  reason?: string;
  allDay: boolean;
  timeZone: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Recurrence pattern interface
 */
export interface RecurrencePattern {
  id: string;
  rrule: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Calendar settings interface
 */
export interface CalendarSettings {
  id: string;
  clinicianId: string;
  defaultSlotDuration: number;
  maxAdvanceDays: number;
  minNoticeDays: number;
  timeZone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Calendar event with date range
 */
export interface CalendarEventWithRange extends CalendarEvent {
  range: {
    start: DateTime;
    end: DateTime;
  };
}

/**
 * Calendar date range
 */
export interface CalendarDateRange {
  start: DateTime;
  end: DateTime;
}

/**
 * Calendar permission level
 */
export type CalendarPermissionLevel = 'full' | 'limited' | 'none';

/**
 * Calendar resource type
 */
export type CalendarResourceType = 'calendar' | 'availability' | 'appointment' | 'time_off';

/**
 * Calendar action type
 */
export type CalendarActionType = 'view' | 'create' | 'edit' | 'delete';