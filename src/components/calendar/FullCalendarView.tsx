import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarApi } from '@fullcalendar/core';
import { toast } from '@/hooks/use-toast';
import { CalendarViewType, CalendarEvent } from '@/types/calendar';
import { Loader2 } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import CalendarAvailabilityHandler from './CalendarAvailabilityHandler';
import { TimeZoneService } from '@/utils/timeZoneService';

interface FullCalendarProps {
  clinicianId: string;
  userTimeZone: string;
  view?: CalendarViewType;
  height?: string | number;
  showAvailability?: boolean;
  onAvailabilityClick?: (event: any) => void;
}

const FullCalendarView: React.FC<FullCalendarProps> = ({
  clinicianId,
  userTimeZone,
  view = 'timeGridWeek',
  height = '700px',
  showAvailability = false,
  onAvailabilityClick,
}) => {
  const calendarRef = useRef<CalendarApi | null>(null);
  const [availabilityEvents, setAvailabilityEvents] = useState<any[]>([]);
  const [hasAvailabilityError, setHasAvailabilityError] = useState(false);

  const {
    events: appointmentEvents,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useCalendarEvents({
    clinicianId,
    userTimeZone,
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

  const handleAvailabilityEvents = (events: any[], error?: Error) => {
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

  const combinedEvents = [...appointmentEvents, ...availabilityEvents];

  console.log('[FullCalendarView] Combined events:', {
    appointments: appointmentEvents.length,
    availability: availabilityEvents.length,
    total: combinedEvents.length,
    hasAvailabilityError
  });

  const handleEventClick = (info: any) => {
    const eventType = info.event.extendedProps.eventType;
    
    if (eventType === 'availability' && typeof onAvailabilityClick === 'function') {
      try {
        onAvailabilityClick(info.event);
      } catch (error) {
        console.error('[FullCalendarView] Error in availability click handler:', error);
        toast({
          title: 'Error',
          description: 'There was a problem processing this availability slot.',
          variant: 'destructive',
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

  try {
    const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
    
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
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={combinedEvents}
          height={height}
          eventClick={handleEventClick}
          timeZone={validTimeZone}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          firstDay={0} // Sunday as first day
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          eventClassNames={(arg) => {
            const eventType = arg.event.extendedProps.eventType;
            
            if (eventType === 'availability') {
              return ['bg-green-200', 'text-green-900', 'border-green-300', 'hover:bg-green-300', 'cursor-pointer'];
            } else if (arg.event.extendedProps.status === 'cancelled') {
              return ['bg-red-100', 'text-red-800', 'border-red-200', 'line-through', 'opacity-70'];
            } else {
              return ['bg-blue-100', 'text-blue-800', 'border-blue-200'];
            }
          }}
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
    
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50 text-red-800">
        <h3 className="font-medium">Calendar Error</h3>
        <p>There was a problem initializing the calendar. Please check your timezone settings and try again.</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default FullCalendarView;
