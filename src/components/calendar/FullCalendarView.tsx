import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarProps, CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw, Calendar as CalendarIcon, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [availabilityError, setAvailabilityError] = useState<Error | null>(null);
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

  useEffect(() => {
    try {
      const allEvents = [...(appointmentEvents || [])];
      
      if (showAvailability && !availabilityError) {
        allEvents.push(...availabilityEvents);
      }
      
      console.log('[FullCalendarView] Combined events:', { 
        appointments: appointmentEvents?.length || 0, 
        availability: availabilityEvents.length,
        total: allEvents.length,
        hasAvailabilityError: !!availabilityError
      });
      
      setCombinedEvents(allEvents);
    } catch (err) {
      console.error('[FullCalendarView] Error combining events:', err);
    }
  }, [appointmentEvents, availabilityEvents, showAvailability, availabilityError]);

  const handleEventClick = useCallback((info: any) => {
    try {
      console.log('[FullCalendarView] Event clicked:', info.event);
      
      if (info.event.extendedProps?.isAvailability && onAvailabilityClick) {
        console.log('[FullCalendarView] Handling availability click');
        onAvailabilityClick(info.event);
        return;
      }
      
      if (onEventClick) {
        console.log('[FullCalendarView] Handling regular event click');
        onEventClick(info);
      }
    } catch (err) {
      console.error('[FullCalendarView] Error in event click handler:', err);
    }
  }, [onEventClick, onAvailabilityClick]);

  const handleAvailabilityEventsChange = useCallback((events: CalendarEvent[]) => {
    try {
      console.log(`[FullCalendarView] Received ${events.length} availability events`);
      setAvailabilityEvents(events);
      setAvailabilityError(null);
    } catch (err) {
      console.error('[FullCalendarView] Error handling availability events change:', err);
      setAvailabilityError(err as Error);
    }
  }, []);

  const handleAvailabilityError = useCallback((error: Error) => {
    console.error('[FullCalendarView] Availability error:', error);
    setAvailabilityError(error);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
    setAvailabilityError(null);
  }, [refetch]);

  useEffect(() => {
    console.log('[FullCalendarView] Component mounted/updated with props:', { 
      clinicianId, 
      userTimeZone: validTimeZone,
      showAvailability
    });
    
    return () => {
      console.log('[FullCalendarView] Component will unmount');
    };
  }, [clinicianId, validTimeZone, showAvailability]);
  
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
        <AlertDescription className="space-y-4">
          <p>Error loading calendar events: {error.message || 'Unknown error'}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const weeksToShow = currentView === 'dayGridMonth' ? 12 : 8;

  return (
    <div className="fullcalendar-container">
      {availabilityError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some availability slots couldn't be loaded. Appointments are still visible.
          </AlertDescription>
        </Alert>
      )}

      {showAvailability && clinicianId && (
        <CalendarAvailabilityHandler
          clinicianId={clinicianId}
          userTimeZone={validTimeZone}
          onEventsChange={handleAvailabilityEventsChange}
          onError={handleAvailabilityError}
          showAvailability={showAvailability}
          weeksToShow={weeksToShow}
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
        eventClassNames={(arg) => {
          const classes = [];
          if (arg.event.extendedProps?.isAvailability) {
            classes.push('availability-slot');
            if (arg.event.extendedProps?.isRecurring) {
              classes.push('recurring-availability');
            } else {
              classes.push('single-availability');
            }
          }
          return classes;
        }}
        eventContent={(arg) => {
          const isAvailability = arg.event.extendedProps?.isAvailability;
          
          if (isAvailability) {
            return (
              <div className="fc-event-main-frame">
                <div className="fc-event-title-container">
                  <div className="fc-event-title">
                    {arg.timeText} {arg.event.title || 'Available'}
                    {arg.event.extendedProps?.isRecurring && (
                      <span className="text-xs ml-1">(Recurring)</span>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          
          return (
            <div className="fc-event-main-frame">
              <div className="fc-event-title-container">
                <div className="fc-event-title">{arg.timeText} {arg.event.title}</div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default FullCalendarView;
