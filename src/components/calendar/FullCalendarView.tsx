import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, EventDropArg, EventResizeDoneArg } from '@fullcalendar/core';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, FullCalendarProps } from '@/types/calendar';
import { AppointmentType } from '@/types/appointment';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import './fullCalendar.css'; // Import the CSS

const FullCalendarView: React.FC<FullCalendarProps> = ({
  events,
  clinicianId,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  userTimeZone = 'America/Chicago',
  view = 'timeGridWeek',
  height = 'auto',
  showAvailability = false,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOptions, setCalendarOptions] = useState({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const validTimeZone = ensureIANATimeZone(userTimeZone);
    
    setCalendarOptions({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: view,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      timeZone: validTimeZone,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      slotMinTime: '06:00:00',
      slotMaxTime: '20:00:00',
      allDaySlot: false,
      height,
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short'
      },
      slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short'
      },
      eventClick: (info: EventClickArg) => {
        if (onEventClick) {
          // Extract the original appointment data from extendedProps
          const appointment = info.event.extendedProps?.appointment;
          if (appointment) {
            onEventClick(appointment);
          } else {
            console.warn('Event clicked but no appointment data found:', info.event);
          }
        }
      },
      select: (info: DateSelectArg) => {
        if (onDateSelect) {
          onDateSelect(info);
        }
      },
      eventDrop: (info: EventDropArg) => {
        if (onEventDrop) {
          onEventDrop(info);
        } else {
          // Default behavior: show toast and revert
          toast({
            title: 'Appointment moved',
            description: 'Please note that changes are not saved automatically.',
            variant: 'default'
          });
        }
      },
      eventResize: (info: EventResizeDoneArg) => {
        if (onEventResize) {
          onEventResize(info);
        } else {
          // Default behavior: show toast
          toast({
            title: 'Appointment resized',
            description: 'Please note that changes are not saved automatically.',
            variant: 'default'
          });
        }
      }
    });
    
    setInitialized(true);
  }, [view, userTimeZone, onEventClick, onDateSelect, onEventDrop, onEventResize, height, toast]);

  useEffect(() => {
    console.log(`[FullCalendarView] Rendering with ${events?.length || 0} events`);
  }, [events]);

  if (!initialized) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <div className="full-calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        events={events}
        {...calendarOptions}
      />
    </div>
  );
};

export default FullCalendarView;
