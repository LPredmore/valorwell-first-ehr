
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarProps, CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import CalendarAvailabilityHandler from './CalendarAvailabilityHandler';
import { TimeZoneService } from '@/utils/timeZoneService';

/**
 * A React component that renders a FullCalendar instance.
 */
const FullCalendarView: React.FC<FullCalendarProps> = ({
  clinicianId,
  userTimeZone,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  view = 'timeGridWeek',
  height = '700px',
  showAvailability = false,
  onAvailabilityClick,
}) => {
  const [currentView, setCurrentView] = useState<CalendarViewType>(view);
  const [availabilityEvents, setAvailabilityEvents] = useState<CalendarEvent[]>([]);
  const [combinedEvents, setCombinedEvents] = useState<CalendarEvent[]>([]);
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  const {
    events: appointmentEvents,
    isLoading,
    error,
    refetch
  } = useCalendarEvents({
    clinicianId,
    userTimeZone: validTimeZone,
  });

  // Combine regular events and availability events
  useEffect(() => {
    const allEvents = [...(appointmentEvents || [])];
    
    if (showAvailability) {
      console.log('[FullCalendarView] Adding availability events:', availabilityEvents.length);
      allEvents.push(...availabilityEvents);
    }
    
    console.log('[FullCalendarView] Combined events total:', allEvents.length);
    setCombinedEvents(allEvents);
  }, [appointmentEvents, availabilityEvents, showAvailability]);

  const handleEventClick = useCallback((info: any) => {
    console.log('[FullCalendarView] Event clicked:', info.event);
    
    // For availability slots, use the specific handler
    if (info.event.extendedProps?.isAvailability && onAvailabilityClick) {
      console.log('[FullCalendarView] Availability slot clicked');
      onAvailabilityClick(info.event);
      return;
    }
    
    // For other events, use the regular handler
    if (onEventClick) {
      onEventClick(info);
    }
  }, [onEventClick, onAvailabilityClick]);

  const handleAvailabilityEventsChange = useCallback((events: CalendarEvent[]) => {
    console.log('[FullCalendarView] Setting availability events:', events.length);
    setAvailabilityEvents(events);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'An error occurred while loading the calendar. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="fullcalendar-container">
      {clinicianId && (
        <CalendarAvailabilityHandler
          clinicianId={clinicianId}
          userTimeZone={validTimeZone}
          onEventsChange={handleAvailabilityEventsChange}
          showAvailability={showAvailability}
        />
      )}
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={currentView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={combinedEvents}
        timeZone={validTimeZone}
        eventClick={handleEventClick}
        dateClick={onDateSelect}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        height={height}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        allDaySlot={true}
        nowIndicator={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        viewDidMount={(arg) => setCurrentView(arg.view.type as CalendarViewType)}
      />
    </div>
  );
};

export default FullCalendarView;
