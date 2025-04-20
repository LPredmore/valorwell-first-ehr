
import React, { useRef } from 'react';
import { CalendarViewType } from '@/types/calendar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent, FullCalendarProps } from '@/types/calendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { convertAppointmentsToEvents } from '@/utils/calendarUtils';
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
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  const { data: events = [], isLoading: isLoadingAppointments } = useQuery({
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

  // New query for fetching availability when showAvailability is true
  const { data: availabilityEvents = [], isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['calendar-availability', clinicianId, userTimeZone, showAvailability],
    queryFn: async () => {
      if (!clinicianId || !showAvailability) return [];
      
      // Get clinician data with availability slots
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select(`
          id,
          clinician_mondaystart1, clinician_mondayend1,
          clinician_mondaystart2, clinician_mondayend2,
          clinician_mondaystart3, clinician_mondayend3,
          clinician_tuesdaystart1, clinician_tuesdayend1,
          clinician_tuesdaystart2, clinician_tuesdayend2,
          clinician_tuesdaystart3, clinician_tuesdayend3,
          clinician_wednesdaystart1, clinician_wednesdayend1,
          clinician_wednesdaystart2, clinician_wednesdayend2,
          clinician_wednesdaystart3, clinician_wednesdayend3,
          clinician_thursdaystart1, clinician_thursdayend1,
          clinician_thursdaystart2, clinician_thursdayend2,
          clinician_thursdaystart3, clinician_thursdayend3,
          clinician_fridaystart1, clinician_fridayend1,
          clinician_fridaystart2, clinician_fridayend2,
          clinician_fridaystart3, clinician_fridayend3,
          clinician_saturdaystart1, clinician_saturdayend1,
          clinician_saturdaystart2, clinician_saturdayend2,
          clinician_saturdaystart3, clinician_saturdayend3,
          clinician_sundaystart1, clinician_sundayend1,
          clinician_sundaystart2, clinician_sundayend2,
          clinician_sundaystart3, clinician_sundayend3
        `)
        .eq('id', clinicianId)
        .single();
      
      if (clinicianError) throw clinicianError;
      
      // Also fetch single day availability if relevant
      const { data: singleDayAvail, error: singleDayError } = await supabase
        .from('single_day_availability')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (singleDayError && singleDayError.code !== 'PGRST116') throw singleDayError;
      
      // Also fetch availability blocks (time offs)
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (blocksError && blocksError.code !== 'PGRST116') throw blocksError;
      
      // Convert all availability data to calendar events
      // This part would use the availabilityUtils to convert the data
      // with time zone adjustments
      const { convertClinicianDataToCalendarEvents } = await import('@/utils/availabilityUtils');
      
      return convertClinicianDataToCalendarEvents(
        clinicianData, 
        singleDayAvail || [], 
        timeBlocks || [], 
        userTimeZone
      );
    },
    enabled: !!clinicianId && showAvailability
  });

  const isLoading = isLoadingAppointments || (showAvailability && isLoadingAvailability);

  if (isLoading) {
    return <LoadingState />;
  }

  // Combine regular events with availability events
  const allEvents = [...events, ...(showAvailability ? availabilityEvents : [])];

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
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={allEvents}
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
          // Add custom classes for availability events
          if (info.event.extendedProps?.isAvailability) {
            return ['availability-event'];
          }
          return [];
        }}
      />
    </div>
  );
};

export default FullCalendarView;
