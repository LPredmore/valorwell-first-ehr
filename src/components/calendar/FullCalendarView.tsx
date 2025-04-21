
import React, { useRef, useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
  
  // Handle errors with more detail
  useEffect(() => {
    if (error) {
      console.error("Calendar error:", error);
      setErrorMessage(error.message || "Failed to load calendar data");
      toast({
        title: "Calendar Error",
        description: "There was a problem loading your calendar data. Please try again.",
        variant: "destructive",
      });
    } else {
      setErrorMessage(null);
    }
  }, [error, toast]);
  
  // Use provided events or fetched events
  const displayEvents = events.length > 0 ? events : fetchedEvents;

  if (isLoading) {
    return <LoadingState />;
  }
  
  if (errorMessage) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading calendar events: {errorMessage}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
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
        eventClassNames={(arg) => {
          const classes = [];
          const eventType = arg.event.extendedProps?.eventType;
          
          if (eventType === 'availability') {
            classes.push('availability-event');
          } else if (eventType === 'time_off') {
            classes.push('time-off-event');
          }
          
          if (arg.event.extendedProps?.recurrenceRule) {
            classes.push('recurring-event');
          }
          
          return classes;
        }}
      />
    </div>
  );
};

export default FullCalendarView;
