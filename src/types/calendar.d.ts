
import { EventInput } from '@fullcalendar/core';
import { AppointmentType } from './appointment';

export interface CalendarEvent extends EventInput {
  extendedProps?: {
    appointment: AppointmentType;
  };
}

export interface FullCalendarProps {
  events: CalendarEvent[];
  clinicianId: string | null;
  onEventClick?: (info: any) => void;
  onDateSelect?: (info: any) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  userTimeZone: string;
  view?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  height?: string | number;
  showAvailability?: boolean;
}
