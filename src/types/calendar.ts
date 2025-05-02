
// If this file already exists, we need to add the CalendarViewType
export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  color?: string;
  textColor?: string;
  classNames?: string[];
  extendedProps?: {
    eventType?: string;
    clientId?: string;
    clinicianId?: string;
    clientName?: string;
    clinicianName?: string;
    status?: string;
    sourceTimeZone?: string;
    displayStart?: string;
    displayEnd?: string;
    displayDay?: string;
    displayDate?: string;
    _userTimeZone?: string;
    [key: string]: any;
  };
}
