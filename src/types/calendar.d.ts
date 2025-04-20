import { EventInput } from '@fullcalendar/core';
import { AppointmentType } from './appointment';

// Centralized view type definition
export type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

export interface CalendarEvent extends EventInput {
  extendedProps?: {
    appointment?: AppointmentType;
    isAvailability?: boolean;
    availabilityBlock?: {
      id: string;
      type: 'weekly' | 'single_day' | 'time_block';
      dayOfWeek?: string;
      date?: string;
      startTime: string;
      endTime: string;
      reason?: string;
    };
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
  showAvailability?: boolean;
}
