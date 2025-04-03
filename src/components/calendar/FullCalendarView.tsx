
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
          // Split exceptions into active exceptions and deleted exceptions
          const activeExceptions = exceptionsData?.filter(exception => 
            !exception.is_deleted && exception.start_time && exception.end_time
          ) || [];
          
          const deletedExceptions = exceptionsData?.filter(exception => 
            exception.is_deleted || !exception.start_time || !exception.end_time
          ) || [];
          
          console.log('Fetched active exceptions:', activeExceptions);
          console.log('Fetched deleted exceptions:', deletedExceptions);
          
          setOneTimeAvailability(activeExceptions);
          
          const availEvents = createAvailabilityEvents(
            availabilityData || [], 
            activeExceptions,
            deletedExceptions
          );
          
          setAvailabilityEvents(availEvents);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setAvailabilityEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  const createAvailabilityEvents = (
    availabilityBlocks: AvailabilityBlock[], 
    activeExceptions: any[],
    deletedExceptions: any[]
  ) => {
    if (!settings) return [];
    
    const dayOfWeekMap: {[key: string]: number} = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    
    const availabilityEvents: any[] = [];
    
    // Create a map of exceptions by original availability ID and date
    const exceptionsByOriginalIdAndDate: Record<string, Record<string, any[]>> = {};
    
    // Process all exceptions (active and deleted)
    [...activeExceptions, ...deletedExceptions].forEach(exception => {
      const date = exception.specific_date;
      const originalId = exception.original_availability_id;
      
      if (originalId) {
        // This is an exception for a recurring availability
        if (!exceptionsByOriginalIdAndDate[originalId]) {
          exceptionsByOriginalIdAndDate[originalId] = {};
        }
        
        if (!exceptionsByOriginalIdAndDate[originalId][date]) {
          exceptionsByOriginalIdAndDate[originalId][date] = [];
        }
        
        exceptionsByOriginalIdAndDate[originalId][date].push(exception);
      }
    });
    
    console.log('Exceptions grouped by original ID and date:', exceptionsByOriginalIdAndDate);
    
    // Process one-time availability exceptions (standalone exceptions)
    activeExceptions.forEach(exception => {
      if (!exception.original_availability_id) {
        // This is a standalone one-time availability
        const event = {
          id: `onetime-${exception.id}`,
          title: 'One-Time Available',
          start: `${exception.specific_date}T${exception.start_time}`,
          end: `${exception.specific_date}T${exception.end_time}`,
          extendedProps: {
            type: 'one-time-availability',
            availabilityData: {
              ...exception,
              isStandalone: true
            }
          },
          backgroundColor: '#0ea5e9',
          borderColor: '#0284c7',
          textColor: '#ffffff',
          display: 'block',
          overlap: false
        };
        
        availabilityEvents.push(event);
      }
    });
    
    // Process recurring availability blocks
    availabilityBlocks.forEach(block => {
      const dowNumber = dayOfWeekMap[block.day_of_week];
      const startTime = block.start_time;
      const endTime = block.end_time;
      
      // Get all dates with exceptions for this recurring block
      const exceptionsForBlock = exceptionsByOriginalIdAndDate[block.id] || {};
      
      // Build a list of dates to exclude from the recurring event
      const excludeDates: string[] = [];
      Object.keys(exceptionsForBlock).forEach(dateStr => {
        // Check if there's a deleted exception or an active exception
        const hasExceptionForDate = exceptionsForBlock[dateStr].some(exc => 
          true  // Every exception is added to the excludeDates list
        );
        
        if (hasExceptionForDate) {
          excludeDates.push(dateStr);
        }
      });
      
      console.log(`For availability ${block.id}, excluding dates:`, excludeDates);
      
      // Create a recurring event that excludes dates with exceptions
      const event = {
        id: `weekly-${block.id}`,
        title: 'Available',
        daysOfWeek: [dowNumber],
        startTime: startTime,
        endTime: endTime,
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
      };
      
      availabilityEvents.push(event);
      
      // Create separate events for modified exceptions
      Object.entries(exceptionsForBlock).forEach(([dateStr, exceptions]) => {
        exceptions.forEach(exception => {
          if (!exception.is_deleted && exception.start_time && exception.end_time) {
            const exceptionEvent = {
              id: `exception-${exception.id}`,
              title: 'Modified Available',
              start: `${dateStr}T${exception.start_time}`,
              end: `${dateStr}T${exception.end_time}`,
              extendedProps: {
                type: 'one-time-availability',
                availabilityData: {
                  ...exception,
                  isException: true
                }
              },
              backgroundColor: '#0ea5e9',
              borderColor: '#0284c7',
              textColor: '#ffffff',
              display: 'block',
              overlap: false
            };
            
            availabilityEvents.push(exceptionEvent);
          }
        });
      });
    });
    
    // Add time off blocks
    timeOffBlocks.forEach(block => {
      availabilityEvents.push({
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
    
    return availabilityEvents;
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
  
  // Process events to ensure recurring events are not shown on dates with exceptions
  const processEvents = (events: any[]) => {
    return events;  // Now we handle exclusion in eventContent rendering
  };
  
  const allEvents = processEvents([...events, ...availabilityEvents]);
  
  return (
    <div className={className}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        initialDate={currentDate}
        headerToolbar={false}
        events={allEvents}
        eventDisplay="block"
        eventContent={(info) => {
          const event = info.event;
          
          // Skip rendering recurring events on dates where they should be excluded
          if (event.extendedProps?.type === 'availability' && 
              event.extendedProps?.excludeDates?.length) {
            
            const eventDate = format(info.event.start!, 'yyyy-MM-dd');
            const excludeDates = event.extendedProps.excludeDates || [];
            
            if (excludeDates.includes(eventDate)) {
              return { html: '' };  // Return empty content to hide the event
            }
          }
          
          return { html: `<div class="fc-event-main-inner">${info.event.title}</div>` };
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
