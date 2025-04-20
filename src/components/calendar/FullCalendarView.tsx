
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, FullCalendarProps } from '@/types/calendar';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { convertAppointmentsToEvents } from '@/utils/calendarUtils';
import './fullCalendar.css';

const FullCalendarView: React.FC<FullCalendarProps> = ({
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
  const [calendarOptions, setCalendarOptions] = useState({});
  const [initialized, setInitialized] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', clinicianId, userTimeZone],
    queryFn: async () => {
      if (!clinicianId) return [];
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, clients(client_first_name, client_last_name)')
        .eq('clinician_id', clinicianId);

      if (error) throw error;
      return convertAppointmentsToEvents(appointments, userTimeZone);
    },
    enabled: !!clinicianId
  });

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
      eventResize: (info: any) => {  // Changed to use 'any' type instead of EventResizeDoneArg
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

  if (!initialized || isLoading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin" />
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
