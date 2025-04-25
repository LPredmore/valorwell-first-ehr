
import { EventContentArg, EventApi } from '@fullcalendar/core';
import { CalendarEvent } from './calendar';

// Extended event content interface that properly extends EventContentArg
export interface FullCalendarEventContent extends Omit<EventContentArg, 'event'> {
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
