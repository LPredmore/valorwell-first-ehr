
import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AppointmentType, FullCalendarEvent } from '@/types/appointment';
import { TimeBlock } from '@/components/calendar/week-view/types';
import { appointmentsToEvents, availabilityToEvents, eventToAppointment } from '@/utils/fullCalendarAdapter';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

interface FullCalendarWrapperProps {
  currentDate: Date;
  clinicianId: string | null;
  appointments: AppointmentType[];
  availabilityBlocks?: TimeBlock[];
  userTimeZone: string;
  view?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  showAvailability?: boolean;
  isLoading?: boolean;
  onAppointmentClick?: (appointment: AppointmentType) => void;
  onAvailabilityClick?: (date: Date, block: TimeBlock) => void;
  onEventChange?: (updatedAppointment: AppointmentType) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  height?: string | number;
}

const FullCalendarWrapper: React.FC<FullCalendarWrapperProps> = ({
  currentDate,
  clinicianId,
  appointments,
  availabilityBlocks = [],
  userTimeZone,
  view = 'timeGridWeek',
  showAvailability = true,
  isLoading = false,
  onAppointmentClick,
  onAvailabilityClick,
  onEventChange,
  onDateSelect,
  height = 'auto'
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<FullCalendarEvent[]>([]);

  // Convert appointments and availability blocks to FullCalendar events
  useEffect(() => {
    const timezone = ensureIANATimeZone(userTimeZone);
    
    // Convert appointments to events
    const appointmentEvents = appointmentsToEvents(appointments, timezone);
    
    // Add availability events if enabled
    const allEvents = showAvailability 
      ? [...appointmentEvents, ...availabilityToEvents(availabilityBlocks, timezone)]
      : appointmentEvents;
    
    setEvents(allEvents);
    
    // Log events for debugging
    console.log(`[FullCalendarWrapper] Prepared ${allEvents.length} events for calendar`, {
      appointments: appointments.length,
      availability: showAvailability ? availabilityBlocks.length : 0,
      view,
      timezone
    });
  }, [appointments, availabilityBlocks, showAvailability, userTimeZone]);

  // Update calendar view when date or view changes
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      // Set the current date
      calendar.getApi().gotoDate(currentDate);
      
      // Set the view if it doesn't match
      if (calendar.getApi().view.type !== view) {
        calendar.getApi().changeView(view);
      }
    }
  }, [currentDate, view]);

  // Handle event click (appointment or availability)
  const handleEventClick = (info: any) => {
    const eventData = info.event;
    const extendedProps = eventData.extendedProps || {};
    
    // Check if this is an availability block
    if (extendedProps.isAvailability && onAvailabilityClick) {
      // Find the original availability block
      const availabilityBlock = availabilityBlocks.find(
        block => block.id === extendedProps.availabilityId
      );
      
      if (availabilityBlock) {
        onAvailabilityClick(eventData.start, availabilityBlock);
      }
      return;
    }
    
    // Handle regular appointment click
    if (extendedProps.originalAppointment && onAppointmentClick) {
      onAppointmentClick(extendedProps.originalAppointment);
    }
  };

  // Handle event drag & resize
  const handleEventChange = (info: any) => {
    if (!onEventChange) return;
    
    const eventData = info.event;
    const extendedProps = eventData.extendedProps || {};
    
    // Only handle regular appointments, not availability
    if (extendedProps.isAvailability) return;
    
    if (extendedProps.originalAppointment) {
      try {
        // Convert the updated event back to an appointment
        const updatedAppointment = eventToAppointment(
          {
            id: eventData.id,
            title: eventData.title,
            start: eventData.start,
            end: eventData.end,
            extendedProps: eventData.extendedProps
          },
          userTimeZone
        );
        
        onEventChange(updatedAppointment);
      } catch (error) {
        console.error('[FullCalendarWrapper] Error converting event to appointment:', error);
      }
    }
  };

  // Handle date selection for creating new appointments
  const handleDateSelect = (info: any) => {
    if (!onDateSelect) return;
    onDateSelect(info.start, info.end);
  };

  if (isLoading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        headerToolbar={false} // We'll use our custom header
        events={events}
        eventClick={handleEventClick}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        selectable={!!onDateSelect}
        select={handleDateSelect}
        selectMirror={true}
        dayMaxEvents={true}
        nowIndicator={true}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="21:00:00"
        height={height}
        expandRows={true}
        slotEventOverlap={false}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        timeZone={userTimeZone}
      />
    </Card>
  );
};

export default FullCalendarWrapper;
