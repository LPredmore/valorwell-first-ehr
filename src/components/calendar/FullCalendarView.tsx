
import React, { useRef } from 'react';
import { CalendarViewType } from '@/types/calendar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { FullCalendarProps } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import CalendarEventHandler from './full-calendar/CalendarEventHandler';
import LoadingState from './full-calendar/LoadingState';
import './fullCalendar.css';

const FullCalendarView: React.FC<FullCalendarProps> = ({
  clinicianId,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  userTimeZone = 'America/Chicago',
  view = 'dayGridMonth' as CalendarViewType,
  height = 'auto',
  showAvailability = false,
  events = []
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  
  // Use the hook to fetch events if not provided directly
  const {
    events: fetchedEvents,
    isLoading,
    error
  } = useCalendarEvents({
    clinicianId,
    userTimeZone,
    showAvailability: showAvailability
  });
  
  // Use provided events or fetched events
  const displayEvents = events.length > 0 ? events : fetchedEvents;

  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading calendar events. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="full-calendar-wrapper">
      <CalendarEventHandler
        onEventClick={onEventClick}
        onDateSelect={onDateSelect}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
      />

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView={view}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={displayEvents}
        timeZone={userTimeZone}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        slotMinTime="06:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        height={height}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        eventClassNames={(info) => {
          const classes = [];
          
          // Add custom classes for availability events
          if (info.event.extendedProps?.isAvailability) {
            classes.push('availability-event');
          }
          
          // Add class for recurring events
          if (info.event.extendedProps?.recurrenceRule) {
            classes.push('recurring-event');
          }
          
          return classes;
        }}
      />
    </div>
  );
};

export default FullCalendarView;
