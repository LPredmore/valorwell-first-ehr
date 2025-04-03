
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isWithinInterval } from 'date-fns';
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

interface TimeOffBlock {
  id: string;
  start_date: string;
  end_date: string;
  note?: string;
  is_active?: boolean;
}

interface AvailabilitySettings {
  time_granularity: string;
  custom_minutes?: number;
  min_days_ahead: number;
  max_days_ahead: number;
  buffer_minutes: number;
  show_availability_to_clients: boolean;
}

interface FullCalendarViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  userTimeZone?: string;
  view?: 'timeGridWeek' | 'dayGridMonth';
  showAvailability?: boolean;
  className?: string;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: AvailabilityBlock) => void;
}

const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  userTimeZone,
  view = 'timeGridWeek',
  showAvailability = true,
  className = '',
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick
}) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [availabilityEvents, setAvailabilityEvents] = useState<any[]>([]);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [timeOffBlocks, setTimeOffBlocks] = useState<TimeOffBlock[]>([]);
  const [oneTimeAvailability, setOneTimeAvailability] = useState<any[]>([]);

  useEffect(() => {
    if (clinicianId) {
      fetchAvailabilitySettings();
      fetchTimeOffBlocks();
    }
  }, [clinicianId, refreshTrigger]);

  const fetchAvailabilitySettings = async () => {
    if (!clinicianId) return;
    
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .single();
        
      if (error) {
        console.error('Error fetching availability settings:', error);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTimeOffBlocks = async () => {
    if (!clinicianId) return;
    
    try {
      const { data, error } = await supabase
        .from('time_off_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true);
        
      if (error) {
        console.error('Error fetching time off blocks:', error);
      } else {
        setTimeOffBlocks(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        textColor: '#ffffff'
      };
    });
    
    setEvents(appointmentEvents);
    
    if (showAvailability) {
      fetchAvailability();
    } else {
      setLoading(false);
    }
  }, [appointments, refreshTrigger, clinicianId, getClientName, showAvailability, timeOffBlocks]);
  
  const fetchAvailability = async () => {
    if (!clinicianId) {
      setAvailabilityEvents([]);
      setLoading(false);
      return;
    }
    
    try {
      // Fetch recurring weekly availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('is_active', true)
        .eq('clinician_id', clinicianId);
        
      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
        setAvailabilityEvents([]);
      } else {
        // Fetch all exceptions
        const { data: exceptionsData, error: exceptionsError } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('clinician_id', clinicianId);
          
        if (exceptionsError) {
          console.error('Error fetching exceptions:', exceptionsError);
          setOneTimeAvailability([]);
        } else {
          // Process availability data with exceptions
          processAvailabilityWithExceptions(availabilityData || [], exceptionsData || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setAvailabilityEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  const processAvailabilityWithExceptions = (
    availabilityBlocks: AvailabilityBlock[], 
    exceptionsData: any[]
  ) => {
    // Create a map of dates to their exceptions for faster lookup
    const exceptionsByDate = new Map<string, any[]>();
    // Create a map of dates that have exceptions for recurring blocks
    const dateHasException = new Map<string, Set<string>>();
    
    // First, organize exceptions by date
    exceptionsData.forEach(exception => {
      const date = exception.specific_date;
      
      // Add to date exceptions map
      if (!exceptionsByDate.has(date)) {
        exceptionsByDate.set(date, []);
      }
      exceptionsByDate.get(date)!.push(exception);
      
      // Track which recurring blocks have exceptions on specific dates
      if (exception.original_availability_id) {
        if (!dateHasException.has(date)) {
          dateHasException.set(date, new Set());
        }
        dateHasException.get(date)!.add(exception.original_availability_id);
      }
    });
    
    const allEvents: any[] = [];
    
    // Process recurring availability blocks
    const dayOfWeekMap: {[key: string]: number} = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    // 1. Add time off blocks
    timeOffBlocks.forEach(block => {
      allEvents.push({
        id: `timeoff-${block.id}`,
        title: block.note || 'Time Off',
        start: block.start_date,
        end: block.end_date,
        allDay: true,
        backgroundColor: '#f97316',
        borderColor: '#ea580c',
        textColor: '#ffffff',
        display: 'background',
        classNames: ['time-off-block']
      });
    });
    
    // 2. Add recurring availability blocks
    availabilityBlocks.forEach(block => {
      const dowNumber = dayOfWeekMap[block.day_of_week];
      
      // Build a list of dates to exclude from the recurring event (dates with exceptions)
      const excludeDates: string[] = [];
      
      // Collect all dates where this recurring block has an exception
      dateHasException.forEach((blockIds, date) => {
        if (blockIds.has(block.id)) {
          excludeDates.push(date);
        }
      });
      
      allEvents.push({
        id: `weekly-${block.id}`,
        title: 'Available',
        daysOfWeek: [dowNumber],
        startTime: block.start_time,
        endTime: block.end_time,
        startRecur: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        endRecur: new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0),
        extendedProps: {
          type: 'availability',
          availabilityData: {
            ...block,
            isRecurring: true
          },
          excludeDates: excludeDates
        },
        backgroundColor: '#10b981',
        borderColor: '#059669',
        textColor: '#ffffff',
        display: 'block',
        overlap: false
      });
    });
    
    // 3. Add exception events (both modified and standalone)
    exceptionsData.forEach(exception => {
      // Skip deleted exceptions that don't have alternative times
      if (exception.is_deleted && (!exception.start_time || !exception.end_time)) {
        return;
      }
      
      // For non-deleted exceptions or exceptions with replacement times, create an event
      if (!exception.is_deleted && exception.start_time && exception.end_time) {
        const isModifiedException = !!exception.original_availability_id;
        
        allEvents.push({
          id: `exception-${exception.id}`,
          title: isModifiedException ? 'Modified Available' : 'One-Time Available',
          start: `${exception.specific_date}T${exception.start_time}`,
          end: `${exception.specific_date}T${exception.end_time}`,
          extendedProps: {
            type: 'one-time-availability',
            availabilityData: {
              id: exception.id,
              day_of_week: new Date(exception.specific_date).toLocaleString('en-US', { weekday: 'long' }),
              start_time: exception.start_time,
              end_time: exception.end_time,
              clinician_id: exception.clinician_id,
              is_active: true,
              isException: isModifiedException,
              isStandalone: !isModifiedException,
              originalAvailabilityId: exception.original_availability_id
            }
          },
          backgroundColor: '#0ea5e9',
          borderColor: '#0284c7',
          textColor: '#ffffff',
          display: 'block',
          overlap: false
        });
      }
    });
    
    setAvailabilityEvents(allEvents);
  };
  
  const isDateInTimeOff = (date: Date) => {
    return timeOffBlocks.some(block => {
      const startDate = new Date(block.start_date);
      const endDate = new Date(block.end_date);
      endDate.setDate(endDate.getDate() + 1);
      
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };
  
  const handleEventClick = (info: any) => {
    const eventType = info.event.extendedProps.type;
    
    if (eventType === 'appointment' && onAppointmentClick) {
      onAppointmentClick(info.event.extendedProps.appointmentData);
    } else if ((eventType === 'availability' || eventType === 'one-time-availability') && onAvailabilityClick) {
      const date = info.event.start;
      const availabilityData = info.event.extendedProps.availabilityData;
      
      if (!isDateInTimeOff(date) && availabilityData) {
        console.log('Availability clicked:', availabilityData);
        onAvailabilityClick(date, availabilityData);
      }
    }
  };
  
  const handleDateClick = (info: any) => {
    if (onAvailabilityClick) {
      const date = new Date(info.date);
      const dayOfWeek = format(date, 'EEEE');
      
      if (!isDateInTimeOff(date)) {
        const tempBlock = {
          id: 'new',
          day_of_week: dayOfWeek,
          start_time: '09:00:00',
          end_time: '17:00:00',
          isStandalone: true
        };
        
        console.log('Date clicked, creating availability:', tempBlock);
        onAvailabilityClick(date, tempBlock);
      }
    }
  };
  
  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }
  
  const allEvents = [...events, ...availabilityEvents];
  
  return (
    <div className={className}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        initialDate={currentDate}
        headerToolbar={false}
        events={allEvents}
        eventDisplay="block"
        eventContent={(arg) => {
          const event = arg.event;
          
          // Handle hiding recurring events on dates with exceptions
          if (event.extendedProps?.type === 'availability' && 
              event.extendedProps?.excludeDates?.length) {
            
            const eventDate = format(event.start!, 'yyyy-MM-dd');
            const excludeDates = event.extendedProps.excludeDates || [];
            
            if (excludeDates.includes(eventDate)) {
              return { html: '' }; // Hide this event
            }
          }
          
          return { html: `<div class="fc-event-main-inner">${event.title}</div>` };
        }}
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
    </div>
  );
};

export default FullCalendarView;
