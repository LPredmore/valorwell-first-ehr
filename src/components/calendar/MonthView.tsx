
import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToTime12Hour } from '@/utils/timeZoneUtils';

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

interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id: string;
}

interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone?: string;
}

const MonthView: React.FC<MonthViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  const { monthStart, monthEnd, startDate, endDate, days } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return { monthStart, monthEnd, startDate, endDate, days };
  }, [currentDate]);

  useEffect(() => {
    const fetchAvailabilityAndExceptions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('availability')
          .select('*')
          .eq('is_active', true);

        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching availability:', error);
          setAvailabilityData([]);
        } else {
          console.log('MonthView fetched availability data:', data);
          setAvailabilityData(data || []);
          
          if (clinicianId && data && data.length > 0) {
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');
            const availabilityIds = data.map((block: AvailabilityBlock) => block.id);
            
            if (availabilityIds.length > 0) {
              const { data: exceptionsData, error: exceptionsError } = await supabase
                .from('availability_exceptions')
                .select('*')
                .eq('clinician_id', clinicianId)
                .gte('specific_date', startDateStr)
                .lte('specific_date', endDateStr)
                .in('original_availability_id', availabilityIds);
                
              if (exceptionsError) {
                console.error('Error fetching exceptions:', exceptionsError);
                setExceptions([]);
              } else {
                console.log('MonthView exceptions data:', exceptionsData);
                setExceptions(exceptionsData || []);
              }
            } else {
              setExceptions([]);
            }
          } else {
            setExceptions([]);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setAvailabilityData([]);
        setExceptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndExceptions();
  }, [clinicianId, refreshTrigger, startDate, endDate]);

  const dayAvailabilityMap = useMemo(() => {
    const result = new Map<string, { 
      hasAvailability: boolean, 
      isModified: boolean,
      displayHours: string 
    }>();
    
    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      
      const regularAvailability = availabilityData.filter(
        slot => slot.day_of_week === dayOfWeek
      );
      
      let hasAvailability = false;
      let isModified = false;
      let displayHours = '';
      
      if (regularAvailability.length > 0) {
        const availabilityIds = regularAvailability.map(slot => slot.id);
        const deletedExceptions = exceptions.filter(
          exception => 
            exception.specific_date === dateStr && 
            availabilityIds.includes(exception.original_availability_id) &&
            exception.is_deleted
        );
        
        hasAvailability = deletedExceptions.length < regularAvailability.length;
        
        const modifiedExceptions = exceptions.filter(
          exception => 
            exception.specific_date === dateStr && 
            !exception.is_deleted &&
            exception.start_time && 
            exception.end_time
        );
        
        isModified = modifiedExceptions.length > 0;
        
        // Generate display hours (6:00 AM to 10:00 PM time range)
        if (hasAvailability) {
          const earliestHour = 6; // 6:00 AM
          const latestHour = 22; // 10:00 PM
          
          let firstAvailableSlot = regularAvailability[0].start_time;
          let lastAvailableSlot = regularAvailability[0].end_time;
          
          // If there are exceptions, use their times when appropriate
          if (isModified) {
            const exceptionWithTimes = modifiedExceptions.find(e => e.start_time && e.end_time);
            if (exceptionWithTimes && exceptionWithTimes.start_time && exceptionWithTimes.end_time) {
              firstAvailableSlot = exceptionWithTimes.start_time;
              lastAvailableSlot = exceptionWithTimes.end_time;
            }
          }
          
          const startHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${firstAvailableSlot}`));
          const endHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${lastAvailableSlot}`));
          
          displayHours = `${startHourFormatted}-${endHourFormatted}`;
        }
      }
      
      result.set(dateStr, { hasAvailability, isModified, displayHours });
    });
    
    return result;
  }, [days, availabilityData, exceptions]);

  const handleDayAvailabilityClick = (day: Date) => {
    if (!onAvailabilityClick) return;
    
    const dayOfWeek = format(day, 'EEEE');
    
    const firstAvailability = availabilityData.find(
      slot => slot.day_of_week === dayOfWeek
    );
    
    if (firstAvailability) {
      onAvailabilityClick(day, firstAvailability);
    }
  };

  const dayAppointmentsMap = useMemo(() => {
    const result = new Map<string, Appointment[]>();
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = appointments.filter(appointment => appointment.date === dayStr);
      result.set(dayStr, dayAppointments);
    });
    
    return result;
  }, [days, appointments]);

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-1">
        {weekDayNames.map((day) => (
          <div key={day} className="p-2 text-center font-medium border-b border-gray-200">
            {day.slice(0, 3)}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = dayAppointmentsMap.get(dateStr) || [];
          const dayAvailability = dayAvailabilityMap.get(dateStr) || { 
            hasAvailability: false, 
            isModified: false,
            displayHours: ''
          };
          
          return (
            <div
              key={day.toString()}
              className={`p-2 min-h-[100px] border border-gray-100 ${!isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : ''} ${isSameDay(day, new Date()) ? 'border-valorwell-500 border-2' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-valorwell-500' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayAvailability.hasAvailability && isSameMonth(day, monthStart) && (
                  <div 
                    className={`${dayAvailability.isModified ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800'} text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-colors`}
                    onClick={() => handleDayAvailabilityClick(day)}
                  >
                    {dayAvailability.isModified ? 'Modified' : 'Available'}
                    {dayAvailability.displayHours && (
                      <div className="text-xs mt-0.5">{dayAvailability.displayHours}</div>
                    )}
                  </div>
                )}
              </div>
              
              {dayAppointments.length > 0 && isSameMonth(day, monthStart) && (
                <div className="mt-1 space-y-1">
                  {dayAppointments.slice(0, 3).map(appointment => (
                    <div 
                      key={appointment.id} 
                      className="bg-blue-100 text-blue-800 text-xs p-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
                    >
                      {formatDateToTime12Hour(parseISO(`2000-01-01T${appointment.start_time}`))} - {getClientName(appointment.client_id)}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MonthView;
