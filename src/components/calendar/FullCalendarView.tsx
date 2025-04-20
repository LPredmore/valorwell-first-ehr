import React, { useRef, useState } from 'react';
import { CalendarViewType } from '@/types/calendar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { CalendarEvent, FullCalendarProps } from '@/types/calendar';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { convertAppointmentsToEvents } from '@/utils/calendarUtils';
import CalendarToolbar from './full-calendar/CalendarToolbar';
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
  view = 'timeGridWeek' as CalendarViewType,
  height = 'auto',
  showAvailability = false,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<CalendarViewType>(view);

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

  const validTimeZone = ensureIANATimeZone(userTimeZone);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="full-calendar-wrapper">
      <CalendarToolbar 
        onViewChange={setCurrentView}
        currentView={currentView}
      />
      
      <CalendarEventHandler
        onEventClick={onEventClick}
        onDateSelect={onDateSelect}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
      />

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={currentView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,timeGridMonth'
        }}
        events={events}
        timeZone={validTimeZone}
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
      />
    </div>
  );
};

export default FullCalendarView;
