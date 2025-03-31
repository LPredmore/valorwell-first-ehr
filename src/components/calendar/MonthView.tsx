
import React, { useState, useEffect } from 'react';
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
  formatISO
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Array<{
    id: string;
    client_id: string;
    date: string; 
    start_time: string;
    end_time: string;
    type: string;
    status: string;
  }>;
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: any) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: any) => void;
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
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const [exceptionsData, setExceptionsData] = useState<any[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    const fetchAvailabilityAndExceptions = async () => {
      setLoading(true);
      try {
        // 1. Fetch regular availability
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
        } else {
          console.log('MonthView fetched availability data:', data);
          setAvailabilityData(data || []);
          
          // 2. Fetch exceptions for the month's date range
          if (clinicianId && data && data.length > 0) {
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');
            const availabilityIds = data.map((block: any) => block.id);
            
            const { data: exceptions, error: exceptionsError } = await supabase
              .from('availability_exceptions')
              .select('*')
              .eq('clinician_id', clinicianId)
              .gte('specific_date', startDateStr)
              .lte('specific_date', endDateStr)
              .in('original_availability_id', availabilityIds);
              
            if (exceptionsError) {
              console.error('Error fetching exceptions:', exceptionsError);
            } else {
              console.log('MonthView exceptions data:', exceptions);
              setExceptionsData(exceptions || []);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndExceptions();
  }, [clinicianId, refreshTrigger, startDate, endDate]);

  // Check if a day has availability with exceptions applied
  const hasDayAvailability = (day: Date) => {
    const dayOfWeek = format(day, 'EEEE');
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Get regular availability for this day of week
    const regularAvailability = availabilityData.filter(
      slot => slot.day_of_week === dayOfWeek
    );
    
    if (regularAvailability.length === 0) {
      return false;
    }
    
    // Check for exceptions that delete availability
    const availabilityIds = regularAvailability.map(slot => slot.id);
    const deletedExceptions = exceptionsData.filter(
      exception => 
        exception.specific_date === dateStr && 
        availabilityIds.includes(exception.original_availability_id) &&
        exception.is_deleted
    );
    
    // If all availability slots are deleted, return false
    if (deletedExceptions.length === regularAvailability.length) {
      return false;
    }
    
    return true;
  };
  
  // Check if a day has modified availability
  const hasDayModifiedAvailability = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Check for exceptions that modify availability times
    const modifiedExceptions = exceptionsData.filter(
      exception => 
        exception.specific_date === dateStr && 
        !exception.is_deleted &&
        exception.start_time && 
        exception.end_time
    );
    
    return modifiedExceptions.length > 0;
  };

  const handleDayAvailabilityClick = (day: Date) => {
    if (!onAvailabilityClick) return;
    
    const dayOfWeek = format(day, 'EEEE');
    
    // Get the first availability block for this day
    const firstAvailability = availabilityData.find(
      slot => slot.day_of_week === dayOfWeek
    );
    
    if (firstAvailability) {
      onAvailabilityClick(day, firstAvailability);
    }
  };

  const getDayAppointments = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return appointments.filter(appointment => appointment.date === dayStr);
  };

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-1">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
          <div key={day} className="p-2 text-center font-medium border-b border-gray-200">
            {day.slice(0, 3)}
          </div>
        ))}

        {days.map((day) => {
          const dayAppointments = getDayAppointments(day);
          const dayHasAvailability = hasDayAvailability(day);
          const dayHasModifiedAvailability = hasDayModifiedAvailability(day);
          
          return (
            <div
              key={day.toString()}
              className={`p-2 min-h-[100px] border border-gray-100 ${!isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : ''} ${isSameDay(day, new Date()) ? 'border-valorwell-500 border-2' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-valorwell-500' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayHasAvailability && isSameMonth(day, monthStart) && (
                  <div 
                    className={`${dayHasModifiedAvailability ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800'} text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-colors`}
                    onClick={() => handleDayAvailabilityClick(day)}
                  >
                    {dayHasModifiedAvailability ? 'Modified' : 'Available'}
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
                      {format(parseISO(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - {getClientName(appointment.client_id)}
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
