import { Appointment, ProcessedAppointment } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

export type { 
  Appointment,
  ProcessedAppointment
} from '@/types/appointment';

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
}

export interface AvailabilityException {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
  type: 'block' | 'unblock';
}

export interface TimeBlock {
  id?: string;
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  type?: 'block' | 'unblock';
}

export interface AppointmentBlock {
  id: string;
  clientName: string;
  day: Date;
  start: Date;
  end: Date;
  status: string;
}

import { useState, useEffect } from 'react';

export function useWeekViewData(days: Date[], clinicianId: string | null, refreshTrigger: number = 0, appointments: Appointment[] = [], getClientName: (clientId: string) => string, userTimeZone: string) {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!clinicianId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[useWeekViewData] Fetching availability data for clinician:', clinicianId);
        
        // Get the date range for the week
        const firstDay = days[0];
        const lastDay = days[days.length - 1];
        const startDateStr = format(firstDay, 'yyyy-MM-dd');
        const endDateStr = format(lastDay, 'yyyy-MM-dd');
        
        console.log(`[useWeekViewData] Date range: ${startDateStr} to ${endDateStr}`);
        
        // 1. Fetch regular weekly availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_active', true);
          
        if (availabilityError) {
          console.error('[useWeekViewData] Error fetching availability:', availabilityError);
          throw new Error(`Failed to fetch availability data: ${availabilityError.message}`);
        }
        
        console.log(`[useWeekViewData] Retrieved ${availabilityData?.length || 0} regular availability records`);
        
        // 2. Fetch availability exceptions
        const { data: exceptionData, error: exceptionError } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('specific_date', startDateStr)
          .lte('specific_date', endDateStr);
          
        if (exceptionError) {
          console.error('[useWeekViewData] Error fetching exceptions:', exceptionError);
          throw new Error(`Failed to fetch exception data: ${exceptionError.message}`);
        }
        
        console.log(`[useWeekViewData] Retrieved ${exceptionData?.length || 0} exception records`);
        
        // 3. Fetch single-day availability
        const { data: singleDayData, error: singleDayError } = await supabase
          .from('availability_single_date')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('date', startDateStr)
          .lte('date', endDateStr);
          
        if (singleDayError && singleDayError.code !== 'PGRST116') {
          console.error('[useWeekViewData] Error fetching single-day availability:', singleDayError);
          // Non-critical error, continue with empty array
        }
        
        console.log(`[useWeekViewData] Retrieved ${singleDayData?.length || 0} single-day availability records`);
        
        // Process availability by day of week and create time blocks
        const processedTimeBlocks: TimeBlock[] = [];
        
        // Map of date strings to exception records
        const exceptionMap = new Map<string, any[]>();
        if (exceptionData) {
          exceptionData.forEach(exception => {
            const dateStr = exception.specific_date;
            if (!exceptionMap.has(dateStr)) {
              exceptionMap.set(dateStr, []);
            }
            exceptionMap.get(dateStr)?.push(exception);
          });
        }
        
        // Map of date strings to single-day availability records
        const singleDayMap = new Map<string, any[]>();
        if (singleDayData) {
          singleDayData.forEach(singleDay => {
            const dateStr = singleDay.date;
            if (!singleDayMap.has(dateStr)) {
              singleDayMap.set(dateStr, []);
            }
            singleDayMap.get(dateStr)?.push(singleDay);
          });
        }
        
        // Process each day in the week
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayOfWeek = format(day, 'EEEE').toLowerCase(); // e.g., "monday", "tuesday", etc.
          
          // Check if there are exceptions for this day
          const dayExceptions = exceptionMap.get(dateStr) || [];
          const daySingleAvailability = singleDayMap.get(dateStr) || [];
          
          // If there are single-day availability records, use those
          if (daySingleAvailability.length > 0) {
            daySingleAvailability.forEach(singleDay => {
              if (singleDay.start_time && singleDay.end_time) {
                // Parse hours and minutes from time string (format: "HH:MM:SS" or "HH:MM")
                const [startHour, startMinute] = singleDay.start_time.split(':').map(Number);
                const [endHour, endMinute] = singleDay.end_time.split(':').map(Number);
                
                // Create Date objects for start and end times
                const startDate = new Date(day);
                startDate.setHours(startHour, startMinute, 0, 0);
                
                const endDate = new Date(day);
                endDate.setHours(endHour, endMinute, 0, 0);
                
                processedTimeBlocks.push({
                  day: day,
                  start: startDate,
                  end: endDate,
                  availabilityIds: [singleDay.id],
                  type: 'unblock'
                });
                
                console.log(`[useWeekViewData] Added single-day availability for ${dateStr}: ${singleDay.start_time} - ${singleDay.end_time}`);
              }
            });
          } 
          // If there are exceptions that aren't marked as deleted, use those
          else if (dayExceptions.some(exc => !exc.is_deleted && exc.start_time && exc.end_time)) {
            dayExceptions
              .filter(exc => !exc.is_deleted && exc.start_time && exc.end_time)
              .forEach(exception => {
                // Parse hours and minutes from time string
                const [startHour, startMinute] = exception.start_time.split(':').map(Number);
                const [endHour, endMinute] = exception.end_time.split(':').map(Number);
                
                // Create Date objects for start and end times
                const startDate = new Date(day);
                startDate.setHours(startHour, startMinute, 0, 0);
                
                const endDate = new Date(day);
                endDate.setHours(endHour, endMinute, 0, 0);
                
                processedTimeBlocks.push({
                  day: day,
                  start: startDate,
                  end: endDate,
                  availabilityIds: [exception.id],
                  type: 'unblock'
                });
                
                console.log(`[useWeekViewData] Added exception availability for ${dateStr}: ${exception.start_time} - ${exception.end_time}`);
              });
          }
          // If there are exceptions marked as deleted, skip this day
          else if (dayExceptions.some(exc => exc.is_deleted)) {
            console.log(`[useWeekViewData] Skipping ${dateStr} due to deleted exception`);
          }
          // Otherwise, use regular weekly availability
          else {
            const dayAvailability = availabilityData?.filter(avail => 
              avail.day_of_week.toLowerCase() === dayOfWeek
            ) || [];
            
            dayAvailability.forEach(avail => {
              if (avail.start_time && avail.end_time) {
                // Parse hours and minutes from time string
                const [startHour, startMinute] = avail.start_time.split(':').map(Number);
                const [endHour, endMinute] = avail.end_time.split(':').map(Number);
                
                // Create Date objects for start and end times
                const startDate = new Date(day);
                startDate.setHours(startHour, startMinute, 0, 0);
                
                const endDate = new Date(day);
                endDate.setHours(endHour, endMinute, 0, 0);
                
                processedTimeBlocks.push({
                  day: day,
                  start: startDate,
                  end: endDate,
                  availabilityIds: [avail.id],
                });
                
                console.log(`[useWeekViewData] Added regular availability for ${dateStr} (${dayOfWeek}): ${avail.start_time} - ${avail.end_time}`);
              }
            });
          }
        });

        setTimeBlocks(processedTimeBlocks);

        // Process appointments
        const appointmentBlocks = appointments.map(appointment => {
          const start = parseISO(`${appointment.date}T${appointment.start_time}`);
          const end = parseISO(`${appointment.date}T${appointment.end_time}`);

          return {
            id: appointment.id,
            clientName: appointment.clientName || getClientName(appointment.client_id),
            day: startOfDay(start),
            start: start,
            end: end,
            status: appointment.status,
          };
        });

        setAppointmentBlocks(appointmentBlocks);
      } catch (err: any) {
        console.error('[useWeekViewData] Error processing data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [days, clinicianId, refreshTrigger, appointments, getClientName, userTimeZone]);

  return {
    loading,
    timeBlocks,
    appointmentBlocks,
    error,
  };
}
