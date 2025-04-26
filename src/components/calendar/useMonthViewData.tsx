import { useState, useEffect, useMemo } from 'react';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';
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
  clinician_id: string;
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
      const now = DateTime.fromJSDate(currentDate);
      const startDate = now.startOf('week');
      const endDate = now.endOf('week');
      const days = [];
      
      let day = startDate;
      while (day <= endDate) {
        days.push(day.toJSDate());
        day = day.plus({ days: 1 });
      }
      
      return { 
        monthStart: startDate.toJSDate(),
        monthEnd: endDate.toJSDate(),
        startDate: startDate.toJSDate(), 
        endDate: endDate.toJSDate(), 
        days 
      };
    }
    
    const now = DateTime.fromJSDate(currentDate);
    const monthStart = now.startOf('month');
    const monthEnd = now.endOf('month');
    const startDate = monthStart.startOf('week');
    const endDate = monthEnd.endOf('week');
    const days = [];
    
    let day = startDate;
    while (day <= endDate) {
      days.push(day.toJSDate());
      day = day.plus({ days: 1 });
    }
    
    return { monthStart: monthStart.toJSDate(), monthEnd: monthEnd.toJSDate(), startDate: startDate.toJSDate(), endDate: endDate.toJSDate(), days };
  }, [currentDate, weekViewMode]);

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

  useEffect(() => {
    const fetchTimeBlocks = async () => {
      if (!clinicianId || !supportsTimeBlocks) {
        return;
      }

      try {
        const startDateStr = DateTime.fromJSDate(startDate).toFormat('yyyy-MM-dd');
        const endDateStr = DateTime.fromJSDate(endDate).toFormat('yyyy-MM-dd');
        
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
          reason: block.reason || undefined,
          clinician_id: block.clinician_id
        })) || [];
        
        setTimeBlocks(formattedBlocks);
      } catch (error) {
        console.error('[MonthView] Error fetching time blocks:', error);
      }
    };
    
    fetchTimeBlocks();
  }, [clinicianId, startDate, endDate, supportsTimeBlocks, refreshTrigger]);

  useEffect(() => {
    const fetchSingleDayAvailability = async () => {
      if (!clinicianId || !supportsSingleDateAvailability) {
        return;
      }

      try {
        const startDateStr = DateTime.fromJSDate(startDate).toFormat('yyyy-MM-dd');
        const endDateStr = DateTime.fromJSDate(endDate).toFormat('yyyy-MM-dd');
        
        console.log(`[MonthView] Fetching single-day availability for date range: ${startDateStr} to ${endDateStr}`);
        
        const { data, error } = await supabase
          .from('single_day_availability')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('availability_date', startDateStr)
          .lte('availability_date', endDateStr);
          
        if (error) {
          console.error('[MonthView] Error fetching single-day availability:', error);
          
          const { data: altData, error: altError } = await supabase
            .from('availability_single_date')
            .select('*')
            .eq('clinician_id', clinicianId)
            .gte('date', startDateStr)
            .lte('date', endDateStr);
            
          if (altError) {
            console.error('[MonthView] Error fetching alternate single-day table:', altError);
            setSingleDayAvailability([]);
          } else {
            const mappedData = (altData || []).map(item => ({
              id: item.id,
              availability_date: item.date,
              start_time: item.start_time,
              end_time: item.end_time,
              clinician_id: item.clinician_id
            }));
            console.log(`[MonthView] Retrieved ${mappedData.length} alternate single-day availability records`);
            setSingleDayAvailability(mappedData);
          }
        } else {
          console.log(`[MonthView] Retrieved ${data?.length || 0} single-day availability records`);
          setSingleDayAvailability(data || []);
        }
      } catch (error) {
        console.error('[MonthView] Error fetching single-day availability:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSingleDayAvailability();
  }, [clinicianId, startDate, endDate, supportsSingleDateAvailability, refreshTrigger]);

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
      const dateStr = DateTime.fromJSDate(day).toFormat('yyyy-MM-dd');
      const dayOfWeek = DateTime.fromJSDate(day).toFormat('cccc').toLowerCase();
      
      const regularAvailability = clinicianSchedule.weekly_schedule?.[dayOfWeek] || [];
      
      const singleDayRecord = singleDayAvailability.find(item => 
        item.availability_date === dateStr
      );
      
      const dateTimeBlocks = timeBlocks.filter(block => 
        block.block_date === dateStr
      );
      
      let hasAvailability = regularAvailability.length > 0;
      let isModified = false;
      let displayHours = '';
      
      if (singleDayRecord) {
        hasAvailability = true;
        isModified = true;
        
        const startTime = DateTime.fromISO(`2000-01-01T${singleDayRecord.start_time}`);
        const endTime = DateTime.fromISO(`2000-01-01T${singleDayRecord.end_time}`);
        
        displayHours = `${startTime.toFormat('h:mm a')}-${endTime.toFormat('h:mm a')}`;
      } else if (hasAvailability) {
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
        
        const startHourFormatted = TimeZoneService.formatTime(earliestStart);
        const endHourFormatted = TimeZoneService.formatTime(latestEnd);
        
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
      const dayOfWeek = DateTime.fromJSDate(day).toFormat('EEEE').toLowerCase();
      const dateStr = DateTime.fromJSDate(day).toFormat('yyyy-MM-dd');
      
      const singleDayRecord = singleDayAvailability.find(item => item.availability_date === dateStr);
      
      if (singleDayRecord) {
        const block: AvailabilityBlock = {
          id: singleDayRecord.id,
          day_of_week: DateTime.fromJSDate(day).toFormat('EEEE'),
          start_time: singleDayRecord.start_time,
          end_time: singleDayRecord.end_time,
          clinician_id: singleDayRecord.clinician_id,
          is_active: true,
          isException: true
        };
        result.set(dateStr, block);
      } else {
        const daySchedule = clinicianSchedule.weekly_schedule?.[dayOfWeek] || [];
        
        if (daySchedule.length > 0) {
          const firstSlot = daySchedule[0];
          const block: AvailabilityBlock = {
            id: `${clinicianId}-${dayOfWeek}-${firstSlot.start_time}`,
            day_of_week: DateTime.fromJSDate(day).toFormat('EEEE'),
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
      const dayStr = DateTime.fromJSDate(day).toFormat('yyyy-MM-dd');
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
