
import { EventContentArg, EventApi } from '@fullcalendar/core';
import { CalendarEvent } from './calendar';

export interface FullCalendarEventContent extends EventContentArg {
  event: EventApi & {
    extendedProps?: {
      isAvailability?: boolean;
      isRecurring?: boolean;
      originalSlotId?: string;
      dayOfWeek?: string;
      eventType?: string;
      timezone?: string;
      is_active?: boolean;
    };
    title: string;
  };
  timeText: string;
  view: {
    type: string;
  };
}
