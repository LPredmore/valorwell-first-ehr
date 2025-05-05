
import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { formatDateToTime12Hour } from '@/utils/timeZoneUtils';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';

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

export const useMonthViewData = (
  currentDate: Date,
  clinicianId: string | null,
  refreshTrigger: number = 0,
  appointments: Appointment[] = [],
  userTimeZone: string = 'America/Chicago'
) => {
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
    
    // Log total availability for debugging
    console.log(`Processing ${availabilityData.length} availability blocks for month view`);
    
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
        
        // Always display fixed hours range - 6:00 AM to 10:00 PM
        if (hasAvailability) {
          const startTime = "06:00";
          const endTime = "22:00";
          
          try {
            // Convert times to selected timezone for display
            const startTimeUTC = TimeZoneService.convertTimeToZone(
              `2000-01-01T${startTime}:00Z`, 
              'UTC', 
              userTimeZone
            );
            
            const endTimeUTC = TimeZoneService.convertTimeToZone(
              `2000-01-01T${endTime}:00Z`, 
              'UTC', 
              userTimeZone
            );
            
            const startHourFormatted = startTimeUTC.toFormat('h:mm a');
            const endHourFormatted = endTimeUTC.toFormat('h:mm a');
            
            displayHours = `${startHourFormatted}-${endHourFormatted}`;
          } catch (error) {
            console.error('Error formatting time for availability:', error);
            const startHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${startTime}`));
            const endHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${endTime}`));
            displayHours = `${startHourFormatted}-${endHourFormatted}`;
          }
        }
      }
      
      result.set(dateStr, { hasAvailability, isModified, displayHours });
    });
    
    return result;
  }, [days, availabilityData, exceptions, userTimeZone]);

  const availabilityByDay = useMemo(() => {
    const result = new Map<string, AvailabilityBlock>();
    
    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      
      const firstAvailability = availabilityData.find(
        slot => slot.day_of_week === dayOfWeek
      );
      
      if (firstAvailability) {
        result.set(dateStr, firstAvailability);
      }
    });
    
    return result;
  }, [days, availabilityData]);

  const dayAppointmentsMap = useMemo(() => {
    const result = new Map<string, Appointment[]>();
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = appointments.filter(appointment => appointment.date === dayStr);
      result.set(dayStr, dayAppointments);
    });
    
    return result;
  }, [days, appointments]);

  return {
    loading,
    monthStart,
    monthEnd,
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  };
};
