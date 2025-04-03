
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
      // Fetch regular weekly availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('is_active', true)
        .eq('clinician_id', clinicianId);
        
      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
        setAvailabilityEvents([]);
      } else {
        // Fetch one-time availability exceptions
        const { data: oneTimeData, error: oneTimeError } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_deleted', false);
          
        if (oneTimeError) {
          console.error('Error fetching one-time availability:', oneTimeError);
          setOneTimeAvailability([]);
        } else {
          setOneTimeAvailability(oneTimeData || []);
        }
        
        const availEvents = createAvailabilityEvents(availabilityData || [], oneTimeData || []);
        setAvailabilityEvents(availEvents);
      }
    } catch (error) {
      console.error('Error:', error);
      setAvailabilityEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  const createAvailabilityEvents = (availabilityBlocks: AvailabilityBlock[], oneTimeBlocks: any[]) => {
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
    
    // Process weekly recurring availability
    availabilityBlocks.forEach(block => {
      const dowNumber = dayOfWeekMap[block.day_of_week];
      
      const startTime = block.start_time;
      const endTime = block.end_time;
      
      const timeSlots = getTimeSlots(startTime, endTime, settings);
      
      timeSlots.forEach(slot => {
        const event = {
          id: `${block.id}-${slot.start}`,
          title: 'Available',
          daysOfWeek: [dowNumber],
          startTime: slot.start,
          endTime: slot.end,
          startRecur: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
          endRecur: new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0),
          extendedProps: {
            type: 'availability',
            availabilityData: {
              ...block,
              start_time: slot.start,
              end_time: slot.end
            }
          },
          backgroundColor: '#10b981',
          borderColor: '#059669',
          textColor: '#ffffff',
          display: 'block',
          overlap: false
        };
        
        availabilityEvents.push(event);
      });
    });
    
    // Process one-time availability
    oneTimeBlocks.forEach(block => {
      const timeSlots = getTimeSlots(block.start_time, block.end_time, settings);
      
      timeSlots.forEach(slot => {
        const event = {
          id: `onetime-${block.id}-${slot.start}`,
          title: 'One-Time Available',
          start: `${block.specific_date}T${slot.start}`,
          end: `${block.specific_date}T${slot.end}`,
          extendedProps: {
            type: 'one-time-availability',
            availabilityData: {
              ...block,
              start_time: slot.start,
              end_time: slot.end
            }
          },
          backgroundColor: '#0ea5e9',
          borderColor: '#0284c7',
          textColor: '#ffffff',
          display: 'block',
          overlap: false
        };
        
        availabilityEvents.push(event);
      });
    });
    
    // Add time off blocks
    timeOffBlocks.forEach(block => {
      const startDate = new Date(block.start_date);
      const endDate = new Date(block.end_date);
      endDate.setDate(endDate.getDate() + 1);
      
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
  
  const getTimeSlots = (startTime: string, endTime: string, settings: AvailabilitySettings) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let intervalMinutes: number;
    
    switch (settings.time_granularity) {
      case 'hour':
        intervalMinutes = 60;
        break;
      case 'half_hour':
        intervalMinutes = 30;
        break;
      case 'quarter_hour':
        intervalMinutes = 15;
        break;
      case 'custom':
        intervalMinutes = settings.custom_minutes || 60;
        break;
      default:
        intervalMinutes = 60;
    }
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const slots = [];
    
    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += intervalMinutes) {
      if (minutes + intervalMinutes <= endTotalMinutes) {
        const slotStartHour = Math.floor(minutes / 60);
        const slotStartMinute = minutes % 60;
        
        const slotEndHour = Math.floor((minutes + intervalMinutes) / 60);
        const slotEndMinute = (minutes + intervalMinutes) % 60;
        
        const start = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}:00`;
        const end = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}:00`;
        
        slots.push({ start, end });
      }
    }
    
    return slots;
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
      
      if (!isDateInTimeOff(date)) {
        onAvailabilityClick(date, info.event.extendedProps.availabilityData);
      }
    }
  };
  
  const handleDateClick = (info: any) => {
    if (onAvailabilityClick) {
      const date = new Date(info.date);
      const dayOfWeek = format(date, 'EEEE');
      
      if (!isDateInTimeOff(date)) {
        const tempBlock: AvailabilityBlock = {
          id: 'new',
          day_of_week: dayOfWeek,
          start_time: '09:00:00',
          end_time: '17:00:00'
        };
        
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
