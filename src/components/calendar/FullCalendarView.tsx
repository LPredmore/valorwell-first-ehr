import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarProps, CalendarEvent, CalendarViewType } from '@/types/calendar';
import { FullCalendarEventContent } from '@/types/fullCalendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import CalendarAvailabilityHandler from './CalendarAvailabilityHandler';
import { TimeZoneService } from '@/utils/timeZoneService';
import { formatDateTime } from '@/utils/dateFormatUtils';

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
    try {
      const allEvents = [...(appointmentEvents || [])];
      
      if (showAvailability) {
        allEvents.push(...availabilityEvents);
      }
      
      console.log('[FullCalendarView] Combined events:', { 
        appointments: appointmentEvents?.length || 0, 
        availability: availabilityEvents.length,
        total: allEvents.length 
      });
      
      setCombinedEvents(allEvents);
    } catch (err) {
      console.error('[FullCalendarView] Error combining events:', err);
    }
  }, [appointmentEvents, availabilityEvents, showAvailability]);

  const handleEventClick = useCallback((info: any) => {
    try {
      console.log('[FullCalendarView] Event clicked:', info.event);
      
      // For availability slots, use the specific handler
      if (info.event.extendedProps?.isAvailability && onAvailabilityClick) {
        console.log('[FullCalendarView] Handling availability click');
        onAvailabilityClick(info.event);
        return;
      }
      
      // For other events, use the regular handler
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
    } catch (err) {
      console.error('[FullCalendarView] Error handling availability events change:', err);
    }
  }, []);

  // Add debug logging to track component lifecycle
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
  
  // Handle errors in rendering
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

  const weeksToShow = currentView === 'dayGridMonth' ? 12 : 8;

  return (
    <div className="fullcalendar-container">
      {showAvailability && clinicianId && (
        <CalendarAvailabilityHandler
          clinicianId={clinicianId}
          userTimeZone={validTimeZone}
          onEventsChange={handleAvailabilityEventsChange}
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
        eventContent={(arg: FullCalendarEventContent) => {
          if (arg.event.extendedProps?.isAvailability) {
            return (
              <div className="fc-content">
                <div className="fc-title">
                  {arg.event.title}
                  {arg.event.extendedProps?.isRecurring ? 
                    <span className="text-xs ml-1">(Recurring)</span> : 
                    <span className="text-xs ml-1">(Single)</span>}
                </div>
                <div className="fc-time">{arg.timeText}</div>
              </div>
            );
          }
          return (
            <div className="fc-content">
              <div className="fc-title">{arg.event.title}</div>
              <div className="fc-time">{arg.timeText}</div>
            </div>
          );
        }}
        viewDidMount={(arg) => {
          console.log(`[FullCalendarView] View changed to: ${arg.view.type}`);
          setCurrentView(arg.view.type as CalendarViewType);
        }}
      />

      <style>{`
        .availability-slot {
          border-left: 3px solid;
        }
        .recurring-availability {
          background-color: #22c55e !important;
          border-color: #16a34a !important;
        }
        .single-availability {
          background-color: #3b82f6 !important;
          border-color: #2563eb !important;
        }
      `}</style>
    </div>
  );
};

export default FullCalendarView;
