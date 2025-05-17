
import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { FullCalendarProps } from '@/types/calendar';

const FullCalendarView: React.FC<FullCalendarProps> = ({
  events = [],
  clinicianId,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  userTimeZone,
  view = 'timeGridWeek',
  height = 'auto',
  showAvailability = true
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [initialEvents, setInitialEvents] = useState(events);

  useEffect(() => {
    if (events) {
      // Filter out availability events if showAvailability is false
      let filteredEvents = events;
      if (!showAvailability) {
        filteredEvents = events.filter(event => {
          return event.extendedProps?.eventType !== 'availability';
        });
      }
      setInitialEvents(filteredEvents);
    }
  }, [events, showAvailability]);

  // Get event color based on event type
  const eventClassNames = (info: any) => {
    const eventType = info.event.extendedProps?.eventType;
    const status = info.event.extendedProps?.appointment?.status;

    const classes = [];
    
    if (eventType === 'appointment') {
      classes.push('appointment-event');
      
      // Add class based on status
      if (status === 'completed') {
        classes.push('status-completed');
      } else if (status === 'cancelled') {
        classes.push('status-cancelled');
      } else if (status === 'scheduled') {
        classes.push('status-scheduled');
      }
    } else if (eventType === 'availability') {
      classes.push('availability-event');
    } else if (eventType === 'time_off') {
      classes.push('time-off-event');
    }

    return classes;
  };

  return (
    <div className="calendar-container" style={{ height }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView={view}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={initialEvents}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        nowIndicator={true}
        slotDuration="00:15:00"
        slotLabelInterval="01:00:00"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        timeZone={userTimeZone}
        eventClick={onEventClick}
        select={onDateSelect}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        eventClassNames={eventClassNames}
        height={height}
        fixedWeekCount={false}
        stickyHeaderDates={true}
        expandRows={true}
        dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
      />
    </div>
  );
};

export default FullCalendarView;
