
import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
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

  // Memoize date calculations to improve performance
  const { monthStart, days, startDate, endDate } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return { monthStart, days, startDate, endDate };
  }, [currentDate]);

  // Fetch availability data
  useEffect(() => {
    const fetchAvailabilityFromClinician = async () => {
      setLoading(true);
      try {
        if (!clinicianId) {
          setAvailabilityData([]);
          setLoading(false);
          return;
        }

        // Fetch the clinician data directly
        const { data: clinician, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', clinicianId)
          .single();

        if (error) {
          console.error('Error fetching clinician data:', error);
          setAvailabilityData([]);
        } else {
          console.log('MonthView fetched clinician data:', clinician);
          
          // Extract availability blocks from clinician record
          const extractedBlocks = extractAvailabilityBlocksFromClinician(clinician);
          setAvailabilityData(extractedBlocks);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailabilityData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityFromClinician();
  }, [clinicianId, refreshTrigger, startDate, endDate]);

  // Extract availability blocks from clinician record
  const extractAvailabilityBlocksFromClinician = (clinician: any): AvailabilityBlock[] => {
    if (!clinician) return [];
    
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const blocks: AvailabilityBlock[] = [];
    
    // For each day of the week
    weekdays.forEach(day => {
      const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
      
      // For each slot (1, 2, 3)
      for (let slot = 1; slot <= 3; slot++) {
        const startTimeKey = `clinician_availability_start_${day}_${slot}`;
        const endTimeKey = `clinician_availability_end_${day}_${slot}`;
        
        // If both start and end times exist for this slot, create a block
        if (clinician[startTimeKey] && clinician[endTimeKey]) {
          blocks.push({
            id: `${clinician.id}-${day}-${slot}`,
            day_of_week: dayCapitalized,
            start_time: clinician[startTimeKey],
            end_time: clinician[endTimeKey],
            clinician_id: clinician.id,
            is_active: true
          });
        }
      }
    });
    
    console.log('Extracted availability blocks for month view:', blocks);
    return blocks;
  };

  // Build day availability map with standardized display hours
  const dayAvailabilityMap = useMemo(() => {
    const result = new Map<string, { 
      hasAvailability: boolean, 
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
      let displayHours = '';
      
      if (regularAvailability.length > 0) {
        hasAvailability = true;
        
        // Always display fixed hours range - 6:00 AM to 10:00 PM
        const startTime = "06:00";
        const endTime = "22:00";
        
        try {
          // Create DateTime objects with the time strings and convert to the user's timezone
          const startDateTime = TimeZoneService.createDateTime('2000-01-01', startTime, 'UTC');
          const endDateTime = TimeZoneService.createDateTime('2000-01-01', endTime, 'UTC');
          
          const startTimeInUserZone = TimeZoneService.convertDateTime(startDateTime, 'UTC', userTimeZone);
          const endTimeInUserZone = TimeZoneService.convertDateTime(endDateTime, 'UTC', userTimeZone);
          
          const startHourFormatted = startTimeInUserZone.toFormat('h:mm a');
          const endHourFormatted = endTimeInUserZone.toFormat('h:mm a');
          
          displayHours = `${startHourFormatted}-${endHourFormatted}`;
        } catch (error) {
          console.error('Error formatting time for availability:', error);
          displayHours = '6:00 AM-10:00 PM'; // Fallback display format
        }
      }
      
      result.set(dateStr, { hasAvailability, displayHours });
    });
    
    return result;
  }, [days, availabilityData, userTimeZone]);

  // Map availability blocks to days for lookup
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

  // Map appointments to days for easy lookup
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
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  };
};
