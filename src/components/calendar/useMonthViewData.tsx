
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

interface TimeBlock {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

interface SingleDayAvailability {
  id: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
}

interface ClinicianScheduleData {
  weekly_schedule?: Record<string, { start_time: string, end_time: string }[]>;
  supports_single_date_availability?: boolean;
  supports_time_blocks?: boolean;
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
  const [clinicianSchedule, setClinicianSchedule] = useState<ClinicianScheduleData | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [singleDayAvailability, setSingleDayAvailability] = useState<SingleDayAvailability[]>([]);
  const [supportsTimeBlocks, setSupportsTimeBlocks] = useState<boolean>(false);
  const [supportsSingleDateAvailability, setSupportsSingleDateAvailability] = useState<boolean>(false);

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

  // Fetch availability settings and schedule data
  useEffect(() => {
    const fetchAvailabilitySettings = async () => {
      try {
        if (!clinicianId) {
          console.log('[MonthView] No clinicianId provided, skipping availability fetch');
          setClinicianSchedule(null);
          setTimeBlocks([]);
          setSingleDayAvailability([]);
          setLoading(false);
          return;
        }
        
        console.log(`[MonthView] Fetching availability settings for clinician: ${clinicianId}`);
        
        // Call edge function to get availability settings and weekly schedule
        const response = await fetch(`${window.location.origin}/functions/v1/get-availability-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ clinicianId })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch availability settings: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[MonthView] Received availability settings:', data);
        
        setClinicianSchedule(data);
        setSupportsSingleDateAvailability(!!data.supports_single_date_availability);
        setSupportsTimeBlocks(!!data.supports_time_blocks);
      } catch (error) {
        console.error('[MonthView] Error fetching availability settings:', error);
        setError('Failed to fetch availability settings');
      }
    };

    fetchAvailabilitySettings();
  }, [clinicianId, refreshTrigger]);

  // Fetch time blocks if supported
  useEffect(() => {
    const fetchTimeBlocks = async () => {
      if (!clinicianId || !supportsTimeBlocks) {
        return;
      }

      try {
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        console.log(`[MonthView] Fetching time blocks for date range: ${startDateStr} to ${endDateStr}`);
        
        const { data, error } = await supabase
          .from('time_blocks')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('block_date', startDateStr)
          .lte('block_date', endDateStr);
          
        if (error) {
          console.error('[MonthView] Error fetching time blocks:', error);
          return;
        }
        
        console.log(`[MonthView] Retrieved ${data?.length || 0} time blocks`);
        
        const formattedBlocks = data?.map(block => ({
          id: block.id,
          block_date: block.block_date,
          start_time: block.start_time,
          end_time: block.end_time,
          reason: block.reason || undefined
        })) || [];
        
        setTimeBlocks(formattedBlocks);
      } catch (error) {
        console.error('[MonthView] Error fetching time blocks:', error);
      }
    };
    
    fetchTimeBlocks();
  }, [clinicianId, startDate, endDate, supportsTimeBlocks, refreshTrigger]);

  // Fetch single-day availability if supported
  useEffect(() => {
    const fetchSingleDayAvailability = async () => {
      if (!clinicianId || !supportsSingleDateAvailability) {
        return;
      }

      try {
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        console.log(`[MonthView] Fetching single-day availability for date range: ${startDateStr} to ${endDateStr}`);
        
        const { data, error } = await supabase
          .from('single_day_availability')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('availability_date', startDateStr)
          .lte('availability_date', endDateStr);
          
        if (error) {
          console.error('[MonthView] Error fetching single-day availability:', error);
          return;
        }
        
        console.log(`[MonthView] Retrieved ${data?.length || 0} single-day availability records`);
        
        setSingleDayAvailability(data || []);
      } catch (error) {
        console.error('[MonthView] Error fetching single-day availability:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSingleDayAvailability();
  }, [clinicianId, startDate, endDate, supportsSingleDateAvailability, refreshTrigger]);

  // Process all data once loaded
  useEffect(() => {
    if (clinicianId && clinicianSchedule) {
      setLoading(false);
    }
  }, [clinicianId, clinicianSchedule, timeBlocks, singleDayAvailability]);

  const dayAvailabilityMap = useMemo(() => {
    const result = new Map<string, { 
      hasAvailability: boolean, 
      isModified: boolean,
      displayHours: string 
    }>();
    
    if (!clinicianSchedule?.weekly_schedule) {
      return result;
    }
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = format(day, 'EEEE').toLowerCase();
      
      // Get regular availability for this day of the week
      const regularAvailability = clinicianSchedule.weekly_schedule?.[dayOfWeek] || [];
      
      // Check for single-day availability that overrides regular schedule
      const singleDayRecord = singleDayAvailability.find(item => 
        item.availability_date === dateStr
      );
      
      // Check for time blocks on this date
      const dateTimeBlocks = timeBlocks.filter(block => 
        block.block_date === dateStr
      );
      
      // Determine if there's any availability for this day
      let hasAvailability = regularAvailability.length > 0;
      let isModified = false;
      let displayHours = '';
      
      // If there's a single-day availability record, it overrides regular availability
      if (singleDayRecord) {
        hasAvailability = true;
        isModified = true;
        
        const startHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${singleDayRecord.start_time}`));
        const endHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${singleDayRecord.end_time}`));
        
        displayHours = `${startHourFormatted}-${endHourFormatted}`;
      } else if (hasAvailability) {
        // Use regular availability if no single-day record
        // But also check if time blocks affect this day
        
        if (dateTimeBlocks.length > 0) {
          isModified = true;
        }
        
        // Find earliest start time and latest end time from regular availability
        let earliestStart = "23:59";
        let latestEnd = "00:00";
        
        regularAvailability.forEach(slot => {
          if (slot.start_time < earliestStart) {
            earliestStart = slot.start_time;
          }
          if (slot.end_time > latestEnd) {
            latestEnd = slot.end_time;
          }
        });
        
        // Format times for display
        const startHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${earliestStart}`));
        const endHourFormatted = formatDateToTime12Hour(parseISO(`2000-01-01T${latestEnd}`));
        
        displayHours = `${startHourFormatted}-${endHourFormatted}`;
      }
      
      result.set(dateStr, { hasAvailability, isModified, displayHours });
    });
    
    return result;
  }, [days, clinicianSchedule, singleDayAvailability, timeBlocks]);

  const availabilityByDay = useMemo(() => {
    const result = new Map<string, AvailabilityBlock>();
    
    if (!clinicianSchedule?.weekly_schedule) {
      return result;
    }
    
    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE').toLowerCase();
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Check for single-day availability first
      const singleDayRecord = singleDayAvailability.find(item => item.availability_date === dateStr);
      
      if (singleDayRecord) {
        // Single-day availability overrides regular schedule
        const block: AvailabilityBlock = {
          id: singleDayRecord.id,
          day_of_week: format(day, 'EEEE'), // Use the full day name
          start_time: singleDayRecord.start_time,
          end_time: singleDayRecord.end_time,
          clinician_id: singleDayRecord.clinician_id,
          is_active: true,
          isException: true // Mark as an exception for UI
        };
        result.set(dateStr, block);
      } else {
        // Use regular weekly schedule if available
        const daySchedule = clinicianSchedule.weekly_schedule?.[dayOfWeek] || [];
        
        if (daySchedule.length > 0) {
          // Use first slot as representative for the day
          const firstSlot = daySchedule[0];
          const block: AvailabilityBlock = {
            id: `${clinicianId}-${dayOfWeek}-${firstSlot.start_time}`,
            day_of_week: format(day, 'EEEE'),
            start_time: firstSlot.start_time,
            end_time: firstSlot.end_time,
            clinician_id: clinicianId || undefined,
            is_active: true,
            isException: false
          };
          result.set(dateStr, block);
        }
      }
    });
    
    return result;
  }, [days, clinicianSchedule, singleDayAvailability, clinicianId]);

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
    clinicianSchedule,
    timeBlocks,
    singleDayAvailability,
    supportsSingleDateAvailability,
    supportsTimeBlocks
  };
};
