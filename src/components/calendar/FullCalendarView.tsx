
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarApi, EventClickArg } from '@fullcalendar/core';
import { toast } from '@/hooks/use-toast';
import { CalendarViewType, CalendarEvent, FullCalendarProps } from '@/types/calendar';
import { componentMonitor } from '@/utils/performance/componentMonitor';
import { Loader2 } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import CalendarAvailabilityHandler from './CalendarAvailabilityHandler';
import { TimeZoneService } from '@/utils/timezone';

const FullCalendarView: React.FC<FullCalendarProps> = ({
  clinicianId,
  userTimeZone,
  view = 'timeGridWeek',
  height = '700px',
  showAvailability = false,
  onAvailabilityClick,
  testEvents,
}) => {
  // Performance monitoring
  const renderStartTime = React.useRef(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    componentMonitor.recordRender('FullCalendarView', renderTime, {
      props: { clinicianId, userTimeZone, view, showAvailability }
    });
  });

  const calendarRef = useRef<CalendarApi | null>(null);
  const [availabilityEvents, setAvailabilityEvents] = useState<CalendarEvent[]>([]);
  const [hasAvailabilityError, setHasAvailabilityError] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{start: Date, end: Date} | null>(null);

  // Memoize the timezone to prevent unnecessary re-renders
  const validTimeZone = useMemo(() =>
    TimeZoneService.ensureIANATimeZone(userTimeZone),
    [userTimeZone]
  );

  // Use test events if provided (for performance testing), otherwise fetch from API
  const {
    events: appointmentEvents,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
    refetch: refetchEvents
  } = testEvents ?
    { events: testEvents, isLoading: false, error: null, refetch: () => {} } :
    useCalendarEvents({
      clinicianId,
      userTimeZone: validTimeZone,
      startDate: visibleRange?.start,
      endDate: visibleRange?.end
    });

  useEffect(() => {
    if (appointmentsError) {
      console.error('[FullCalendarView] Error loading appointments:', appointmentsError);
      toast({
        title: 'Error loading appointments',
        description: 'Failed to load appointment data. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [appointmentsError]);

  const handleAvailabilityEvents = (events: CalendarEvent[], error?: Error) => {
    if (error) {
      console.error('[FullCalendarView] Error in availability events:', error);
      setHasAvailabilityError(true);
      toast({
        title: 'Error loading availability',
        description: 'Failed to load availability data. Please try refreshing the page.',
        variant: 'destructive',
      });
    } else {
      console.log('[FullCalendarView] Received', events.length, 'availability events');
      setAvailabilityEvents(events);
      setHasAvailabilityError(false);
    }
  };

  // Handle calendar view range changes for lazy loading
  const handleDatesSet = useCallback(({ start, end }: { start: Date, end: Date }) => {
    setVisibleRange({ start, end });
  }, []);

  // Memoize combinedEvents to prevent unnecessary re-renders
  const combinedEvents = useMemo(() =>
    [...appointmentEvents, ...availabilityEvents],
    [appointmentEvents, availabilityEvents]
  );

  // Use windowing technique - only process events that are in the visible range
  const visibleEvents = useMemo(() => {
    if (!visibleRange) return combinedEvents;
    
    return combinedEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= visibleRange.end && eventEnd >= visibleRange.start;
    });
  }, [combinedEvents, visibleRange]);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[FullCalendarView] Events stats:', {
      appointments: appointmentEvents.length,
      availability: availabilityEvents.length,
      total: combinedEvents.length,
      visible: visibleEvents.length,
      hasAvailabilityError
    });
  }

  const handleEventClick = (info: EventClickArg) => {
    const eventType = info.event.extendedProps?.eventType;
    
    if (eventType === 'availability' && typeof onAvailabilityClick === 'function') {
      try {
        onAvailabilityClick(info.event);
      } catch (error) {
        console.error('[FullCalendarView] Error in availability click handler:', error);
        toast({
          title: "Error",
          description: "There was a problem processing this availability slot.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoadingAppointments) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading calendar events...</span>
      </div>
    );
  }

  // Memoized event class names function
  const getEventClassNames = useMemo(() => (arg: any) => {
    const eventType = arg.event.extendedProps?.eventType;
    
    if (eventType === 'availability') {
      return ['bg-green-200', 'text-green-900', 'border-green-300', 'hover:bg-green-300', 'cursor-pointer'];
    } else if (arg.event.extendedProps?.status === 'cancelled') {
      return ['bg-red-100', 'text-red-800', 'border-red-200', 'line-through', 'opacity-70'];
    } else if (eventType === 'time_off') {
      return ['bg-amber-200', 'text-amber-800', 'border-amber-300'];
    } else {
      return ['bg-blue-200', 'text-blue-800', 'border-blue-300'];
    }
  }, []);

  try {
    return (
      <div className="calendar-container">
        {validTimeZone && (
          <div className="text-sm text-gray-500 mb-2">
            Calendar displayed in {TimeZoneService.formatTimeZoneDisplay(validTimeZone)} timezone
          </div>
        )}
        
        <FullCalendar
          ref={(el) => {
            if (el) calendarRef.current = el.getApi();
          }}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={false} // We're handling the header in the parent component
          events={visibleEvents}
          datesSet={handleDatesSet}
          height={height}
          eventClick={handleEventClick}
          timeZone={validTimeZone}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          firstDay={0}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          eventClassNames={getEventClassNames}
        />
        
        {showAvailability && (
          <CalendarAvailabilityHandler
            clinicianId={clinicianId}
            userTimeZone={validTimeZone}
            onEventsChange={handleAvailabilityEvents}
            showAvailability={true}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('[FullCalendarView] Error rendering calendar:', error);
    toast({
      title: 'Calendar Error',
      description: 'Failed to initialize calendar with the provided timezone settings.',
      variant: 'destructive',
    });
    
    throw error; // Let the error boundary handle it
  }
};

export default React.memo(FullCalendarView);
