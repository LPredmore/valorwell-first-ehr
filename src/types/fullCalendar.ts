
import { EventContentArg } from '@fullcalendar/core';
import { CalendarEvent } from './calendar';

export interface FullCalendarEventContent extends EventContentArg {
  event: CalendarEvent;
  timeText: string;
  view: {
    type: string;
  };
}
