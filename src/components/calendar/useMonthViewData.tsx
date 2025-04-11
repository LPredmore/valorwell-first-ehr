
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
  original_availability_id: string | null;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id: string;
}

interface SingleDayAvailability {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
  is_active?: boolean;
}

// Helper function to normalize day_of_week values that can be either numeric or named
const normalizeDayOfWeek = (day: string): string => {
  // Map of numeric values to day names
  const dayMap: { [key: string]: string } = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };

  // If the day is a number as a string, convert to day name
  return dayMap[day] || day;
};

export const useMonthViewData = (
  currentDate: Date,
  clinicianId: string | null,
  refreshTrigger: number = 0,
  appointments: Appointment[] = [],
  weekViewMode: boolean = false
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [singleDayAvailability, setSingleDayAvailability] = useState<SingleDayAvailability[]>([]);
  const [singleDateTableExists, setSingleDateTableExists] = useState<boolean>(false);

  const { monthStart, monthEnd, startDate, endDate, days } = useMemo(() => {
    if (weekViewMode) {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      return { 
        monthStart: startDate,
        monthEnd: endDate,
        startDate, 
        endDate, 
        days 
      };
    }
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return { monthStart, monthEnd, startDate, endDate, days };
  }, [currentDate, weekViewMode]);

  // Check if the availability_single_date table exists
  useEffect(() => {
    const checkSingleDateTableExists = async () => {
      try {
        const { data, error } = await supabase
          .rpc('check_table_exists', { check_table_name: 'availability_single_date' });
        
        if (error) {
          console.error('[MonthView] Error checking if single date table exists:', error);
          setSingleDateTableExists(false);
        } else {
          console.log('[MonthView] Single date table exists:', !!data);
          setSingleDateTableExists(!!data);
        }
      } catch (error) {
        console.error('[MonthView] Error checking if single date table exists:', error);
        setSingleDateTableExists(false);
      }
    };
    
    checkSingleDateTableExists();
  }, []);

  useEffect(() => {
    const fetchAvailabilityAndExceptions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Verify if we have a clinician ID
        if (!clinicianId) {
          console.log('[MonthView] No clinicianId provided, skipping availability fetch');
          setAvailabilityData([]);
          setExceptions([]);
          setSingleDayAvailability([]);
          setLoading(false);
          return;
        }
        
        console.log(`[MonthView] Fetching availability for clinician: ${clinicianId}`);
        
        // Get current authenticated user
        const { data: authData } = await supabase.auth.getUser();
        console.log(`[MonthView] Current user: ${authData?.user?.id || 'No user'}`);
        
        // Query availability with proper filtering
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('is_active', true)
          .eq('clinician_id', clinicianId);

        if (error) {
          console.error('[MonthView] Error fetching availability:', error);
          setError(`Error fetching availability: ${error.message}`);
          setAvailabilityData([]);
          setExceptions([]);
          setSingleDayAvailability([]);
        } else {
          console.log(`[MonthView] Retrieved ${data?.length || 0} availability records for clinician ${clinicianId}:`, data);
          setAvailabilityData(data || []);
          
          // Format dates for queries
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');
          
          // Fetch exceptions
          if (data && data.length > 0) {
            const availabilityIds = data.map((block: AvailabilityBlock) => block.id);
            
            if (availabilityIds.length > 0) {
              console.log(`[MonthView] Fetching exceptions for clinician: ${clinicianId}, dates: ${startDateStr} to ${endDateStr}`);
              
              const { data: exceptionsData, error: exceptionsError } = await supabase
                .from('availability_exceptions')
                .select('*')
                .eq('clinician_id', clinicianId)
                .gte('specific_date', startDateStr)
                .lte('specific_date', endDateStr);
                
              if (exceptionsError) {
                console.error('[MonthView] Error fetching exceptions:', exceptionsError);
                setError(`Error fetching exceptions: ${exceptionsError.message}`);
                setExceptions([]);
              } else {
                console.log(`[MonthView] Retrieved ${exceptionsData?.length || 0} exceptions:`, exceptionsData);
                setExceptions(exceptionsData || []);
              }
            }
          }
          
          // Fetch single-day availability if the table exists
          if (singleDateTableExists) {
            console.log(`[MonthView] Fetching single day availability for clinician: ${clinicianId}`);
            
            const { data: singleDayData, error: singleDayError } = await supabase
              .from('availability_single_date')
              .select('*')
              .eq('clinician_id', clinicianId)
              .gte('date', startDateStr)
              .lte('date', endDateStr)
              .eq('is_active', true);
              
            if (singleDayError) {
              console.error('[MonthView] Error fetching single day availability:', singleDayError);
              setSingleDayAvailability([]);
            } else {
              console.log(`[MonthView] Retrieved ${singleDayData?.length || 0} single day availability entries:`, singleDayData);
              
              // Map the data to our expected interface
              const formattedSingleDayData = singleDayData?.map(item => ({
                id: item.id,
                date: item.date,
                start_time: item.start_time,
                end_time: item.end_time,
                clinician_id: item.clinician_id,
                is_active: true
              })) || [];
              
              setSingleDayAvailability(formattedSingleDayData);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[MonthView] Exception in availability fetching:', error);
        setError(`Unexpected error: ${errorMessage}`);
        setAvailabilityData([]);
        setExceptions([]);
        setSingleDayAvailability([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndExceptions();
  }, [clinicianId, refreshTrigger, startDate, endDate, singleDateTableExists]);

  const dayAvailabilityMap = useMemo(() => {
    const result = new Map<string, { 
      hasAvailability: boolean, 
      isModified: boolean,
      displayHours: string 
    }>();
    
    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Get exceptions for this specific date (if any)
      const dateExceptions = exceptions.filter(exception => exception.specific_date === dateStr);
      
      // Get deleted availability ids for this date
      const deletedAvailabilityIds = new Set(
        dateExceptions
          .filter(exception => exception.is_deleted)
          .map(exception => exception.original_availability_id)
      );
      
      // Handle both named and numeric day values
      const regularAvailability = availabilityData.filter(
        slot => {
          const normalizedSlotDay = normalizeDayOfWeek(slot.day_of_week);
          return normalizedSlotDay === dayOfWeek;
        }
      );
      
      // Filter out deleted availabilities
      const activeAvailability = regularAvailability.filter(
        slot => !deletedAvailabilityIds.has(slot.id)
      );
      
      // Check for single-day availability for this date
      const daySpecificAvailability = singleDayAvailability.filter(item => item.date === dateStr);
      
      let hasAvailability = activeAvailability.length > 0 || daySpecificAvailability.length > 0;
      let isModified = false;
      let displayHours = '';
      
      if (hasAvailability) {
        const timeModifiedExceptions = dateExceptions.filter(
          exception => !exception.is_deleted && exception.start_time && exception.end_time
        );
        
        isModified = timeModifiedExceptions.length > 0 || daySpecificAvailability.length > 0;
        
        // Find earliest start time and latest end time from all available slots
        let earliestStart = "23:59";
        let latestEnd = "00:00";
        
        // Check exceptions first as they override regular availability
        if (timeModifiedExceptions.length > 0) {
          timeModifiedExceptions.forEach(exception => {
            if (exception.start_time && exception.start_time < earliestStart) {
              earliestStart = exception.start_time;
            }
            if (exception.end_time && exception.end_time > latestEnd) {
              latestEnd = exception.end_time;
            }
          });
        } else {
          // Use regular availability if no exceptions
          activeAvailability.forEach(slot => {
            if (slot.start_time < earliestStart) {
              earliestStart = slot.start_time;
            }
            if (slot.end_time > latestEnd) {
              latestEnd = slot.end_time;
            }
          });
        }
        
        // Also check single-day availability
        if (daySpecificAvailability.length > 0) {
          daySpecificAvailability.forEach(slot => {
            if (slot.start_time < earliestStart) {
              earliestStart = slot.start_time;
            }
            if (slot.end_time > latestEnd) {
              latestEnd = slot.end_time;
            }
          });
        }
        
        // Format times for display
        const startHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${earliestStart}`));
        const endHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${latestEnd}`));
        
        displayHours = `${startHourFormatted}-${endHourFormatted}`;
      }
      
      result.set(dateStr, { hasAvailability, isModified, displayHours });
    });
    
    return result;
  }, [days, availabilityData, exceptions, singleDayAvailability]);

  const availabilityByDay = useMemo(() => {
    const result = new Map<string, AvailabilityBlock>();
    
    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Get exceptions for this specific date (if any)
      const dateExceptions = exceptions.filter(exception => exception.specific_date === dateStr);
      
      // Get deleted availability ids for this date
      const deletedAvailabilityIds = new Set(
        dateExceptions
          .filter(exception => exception.is_deleted)
          .map(exception => exception.original_availability_id)
      );
      
      // Handle both named and numeric day values
      const firstAvailability = availabilityData.find(
        slot => {
          const normalizedSlotDay = normalizeDayOfWeek(slot.day_of_week);
          return normalizedSlotDay === dayOfWeek && !deletedAvailabilityIds.has(slot.id);
        }
      );
      
      // Check for single-day availability for this date
      const daySpecificAvailability = singleDayAvailability.find(item => item.date === dateStr);
      
      // If we have single-day availability, prioritize it over regular availability
      if (daySpecificAvailability) {
        const convertedBlock: AvailabilityBlock = {
          id: daySpecificAvailability.id,
          day_of_week: dayOfWeek, // Use the day name for consistent handling
          start_time: daySpecificAvailability.start_time,
          end_time: daySpecificAvailability.end_time,
          clinician_id: daySpecificAvailability.clinician_id,
          is_active: true,
          isException: true // Mark as an exception to show it's not regular weekly availability
        };
        result.set(dateStr, convertedBlock);
      } else if (firstAvailability) {
        result.set(dateStr, firstAvailability);
      }
    });
    
    return result;
  }, [days, availabilityData, exceptions, singleDayAvailability]);

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
    error,
    monthStart,
    monthEnd,
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay,
    singleDateTableExists
  };
};
