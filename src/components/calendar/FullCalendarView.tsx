import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatDate, format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Appointment as HookAppointment } from '@/hooks/useAppointments';
import { TimeBlock, AppointmentBlockType, AvailabilityBlock as AvailabilityBlockType } from './week-view/types/availability-types';
import { AvailabilityBlockComponent } from './week-view';
import AppointmentBlock from './week-view/AppointmentBlock';

// Create an interface that extends the imported Appointment type to ensure compatibility
interface Appointment extends Partial<HookAppointment> {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  video_room_url?: string | null;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
  isStandalone?: boolean;
  originalAvailabilityId?: string | null;
}

interface FullCalendarViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: AvailabilityBlock | TimeBlock) => void;
  userTimeZone?: string;
  view?: 'dayGridMonth' | 'timeGridWeek';
  showAvailability?: boolean;
  className?: string;
}

const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone,
  view = 'dayGridMonth',
  showAvailability = true,
  className = ''
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!clinicianId) return;

      const events = [];

      // Process appointments
      appointments.forEach(appointment => {
        events.push({
          id: appointment.id,
          title: getClientName(appointment.client_id),
          start: `${appointment.date}T${appointment.start_time}`,
          end: `${appointment.date}T${appointment.end_time}`,
          extendedProps: {
            type: 'appointment',
            appointment
          },
          color: 'rgb(147, 197, 253)',
          textColor: 'rgb(30, 58, 138)'
        });
      });

      // Fetch and process availability blocks
      if (showAvailability) {
        try {
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('availability')
            .select('*')
            .eq('clinician_id', clinicianId)
            .eq('is_active', true);

          if (availabilityError) {
            console.error("Error fetching availability:", availabilityError);
          } else if (availabilityData) {
            availabilityData.forEach(availability => {
              const daysOfWeek = JSON.parse(availability.day_of_week);

              daysOfWeek.forEach((dayOfWeek: number) => {
                // Convert dayOfWeek to a string representation (e.g., '1' for Monday)
                const dayOfWeekStr = String(dayOfWeek);

                events.push({
                  id: availability.id,
                  title: 'Available',
                  daysOfWeek: [dayOfWeekStr],
                  startTime: availability.start_time,
                  endTime: availability.end_time,
                  display: 'background',
                  color: 'green',
                  extendedProps: {
                    type: 'availability',
                    availabilityBlock: availability
                  }
                });
              });
            });
          }
        } catch (error) {
          console.error("Error fetching availability:", error);
        }
      }

      setCalendarEvents(events);
    };

    fetchEvents();
  }, [clinicianId, refreshTrigger, getClientName, showAvailability, appointments]);

  const handleEventClick = (clickInfo: any) => {
    const eventType = clickInfo.event.extendedProps.type;

    if (eventType === 'appointment') {
      const appointment = clickInfo.event.extendedProps.appointment;
      onAppointmentClick?.(appointment);
    } else if (eventType === 'availability') {
      const availabilityBlock = clickInfo.event.extendedProps.availabilityBlock;
      const eventStart = clickInfo.event.start;
      onAvailabilityClick?.(eventStart, availabilityBlock);
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const eventType = event.extendedProps.type;
    
    if (eventType === 'availability') {
      const blockData = event.extendedProps.availabilityBlock;
      return (
        <AvailabilityBlockComponent
          block={blockData}
          day={new Date(event.start)}
          hourHeight={25}
          onAvailabilityClick={onAvailabilityClick}
        />
      );
    } else if (eventType === 'appointment') {
      const appointment = event.extendedProps.appointment;
      return (
        <div className="fc-event-main">
          {getClientName(appointment.client_id)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        headerToolbar={false}
        nowIndicator={true}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        events={calendarEvents}
        timeZone={userTimeZone}
        height="75vh"
      />
    </div>
  );
};

export default FullCalendarView;
