
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { getUserTimeZone } from '@/utils/timeZoneUtils';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
}

interface FullCalendarViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone?: string;
  view?: 'dayGridMonth' | 'timeGridWeek';
  showAvailability?: boolean;
}

const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone = getUserTimeZone(),
  view = 'dayGridMonth',
  showAvailability = true
}) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [availabilityEvents, setAvailabilityEvents] = useState<any[]>([]);

  // Fetch appointments and convert them to FullCalendar events
  useEffect(() => {
    const appointmentEvents = appointments.map(appointment => {
      const dateStr = appointment.date;
      const startTimeStr = appointment.start_time;
      const endTimeStr = appointment.end_time;
      
      const startDateTime = `${dateStr}T${startTimeStr}`;
      const endDateTime = `${dateStr}T${endTimeStr}`;
      
      return {
        id: appointment.id,
        title: getClientName(appointment.client_id),
        start: startDateTime,
        end: endDateTime,
        extendedProps: {
          type: 'appointment',
          appointmentData: appointment
        },
        backgroundColor: '#3b82f6', // Blue color for appointments
        borderColor: '#2563eb',
        textColor: '#ffffff'
      };
    });
    
    setEvents(appointmentEvents);
    
    // We'll call fetchAvailability here if needed
    if (showAvailability) {
      fetchAvailability();
    } else {
      setLoading(false);
    }
  }, [appointments, refreshTrigger, clinicianId, getClientName, showAvailability]);
  
  // Fetch availability blocks and convert them to FullCalendar events
  const fetchAvailability = async () => {
    if (!clinicianId) {
      setAvailabilityEvents([]);
      setLoading(false);
      return;
    }
    
    try {
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('is_active', true)
        .eq('clinician_id', clinicianId);
        
      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
        setAvailabilityEvents([]);
      } else {
        // Convert availability to recurring events
        const availEvents = createAvailabilityEvents(availabilityData || []);
        setAvailabilityEvents(availEvents);
      }
    } catch (error) {
      console.error('Error:', error);
      setAvailabilityEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Convert availability blocks to FullCalendar events with recurrence
  const createAvailabilityEvents = (availabilityBlocks: AvailabilityBlock[]) => {
    // Map day of week from string to number (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeekMap: {[key: string]: number} = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    
    return availabilityBlocks.map(block => {
      // Get the day of week as a number
      const dowNumber = dayOfWeekMap[block.day_of_week];
      
      return {
        id: block.id,
        title: 'Available',
        daysOfWeek: [dowNumber],
        startTime: block.start_time,
        endTime: block.end_time,
        startRecur: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        endRecur: new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0),
        extendedProps: {
          type: 'availability',
          availabilityData: block
        },
        backgroundColor: '#10b981', // Green color for availability
        borderColor: '#059669',
        textColor: '#ffffff',
        display: 'block'
      };
    });
  };
  
  // Handle event click
  const handleEventClick = (info: any) => {
    const eventType = info.event.extendedProps.type;
    
    if (eventType === 'appointment' && onAppointmentClick) {
      onAppointmentClick(info.event.extendedProps.appointmentData);
    } else if (eventType === 'availability' && onAvailabilityClick) {
      const date = info.event.start;
      onAvailabilityClick(date, info.event.extendedProps.availabilityData);
    }
  };
  
  // Handle date click for potentially adding new availability
  const handleDateClick = (info: any) => {
    if (onAvailabilityClick) {
      // Create a temporary availability block for the clicked date
      const date = new Date(info.date);
      const dayOfWeek = format(date, 'EEEE');
      
      const tempBlock: AvailabilityBlock = {
        id: 'new',
        day_of_week: dayOfWeek,
        start_time: '09:00:00',
        end_time: '17:00:00'
      };
      
      onAvailabilityClick(date, tempBlock);
    }
  };
  
  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }
  
  // Combine appointment and availability events
  const allEvents = [...events, ...availabilityEvents];
  
  return (
    <Card className="p-4 rounded-lg shadow-md">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        initialDate={currentDate}
        headerToolbar={false} // We'll use our own custom header
        events={allEvents}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        height="auto"
        timeZone={userTimeZone}
        nowIndicator={view === 'timeGridWeek'}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        expandRows={true}
      />
    </Card>
  );
};

export default FullCalendarView;
