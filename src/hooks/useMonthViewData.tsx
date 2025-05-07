
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';
import { AvailabilityBlock } from '@/types/availability';

// Export this interface so it can be imported by other components
export interface DayAvailabilityData {
  hasAvailability: boolean;
  displayHours: string;
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

  // Convert currentDate to DateTime
  const currentDateTime = TimeZoneService.fromJSDate(currentDate, userTimeZone);

  // Memoize date calculations to improve performance
  const { monthStart, days, startDate, endDate } = useMemo(() => {
    // Use TimeZoneService for date calculations
    const monthStart = TimeZoneService.startOfMonth(currentDateTime);
    const monthEnd = TimeZoneService.endOfMonth(currentDateTime);
    const startDate = TimeZoneService.startOfWeek(monthStart);
    const endDate = TimeZoneService.endOfWeek(monthEnd);
    const days = TimeZoneService.eachDayOfInterval(startDate, endDate);
    
    console.log('[useMonthViewData] Date range:', {
      monthStart: monthStart.toFormat('yyyy-MM-dd'),
      monthEnd: monthEnd.toFormat('yyyy-MM-dd'),
      startDate: startDate.toFormat('yyyy-MM-dd'),
      endDate: endDate.toFormat('yyyy-MM-dd'),
      days: days.length,
      timeZone: userTimeZone
    });
    
    return {
      monthStart,
      days,
      startDate,
      endDate
    };
  }, [currentDateTime, userTimeZone]);

  // Fetch availability data from availability_blocks table
  useEffect(() => {
    const fetchAvailabilityBlocks = async () => {
      setLoading(true);
      try {
        if (!clinicianId) {
          setAvailabilityData([]);
          setLoading(false);
          return;
        }

        console.log(`[useMonthViewData] Fetching availability blocks for clinician: ${clinicianId}`, {
          dateRange: {
            startDate: startDate.toUTC().toISO(),
            endDate: endDate.toUTC().toISO(),
            userTimeZone
          }
        });
        
        // Query the availability_blocks table directly
        const { data: fetchedBlocks, error } = await supabase
          .from('availability_blocks')
          .select('id, clinician_id, start_at, end_at, is_active, recurring_pattern')
          .eq('clinician_id', clinicianId)
          .eq('is_active', true)
          .gte('start_at', startDate.toUTC().toISO())
          .lt('end_at', endDate.toUTC().toISO());

        if (error) {
          console.error('[useMonthViewData] Error fetching availability_blocks:', error);
          setAvailabilityData([]);
        } else {
          console.log(`[useMonthViewData] Fetched ${fetchedBlocks?.length || 0} availability blocks`, {
            sampleBlock: fetchedBlocks?.length > 0 ? fetchedBlocks[0] : null,
            timeZone: userTimeZone
          });
          setAvailabilityData(fetchedBlocks || []);
        }
      } catch (error) {
        console.error('[useMonthViewData] Error fetching availability:', error);
        setAvailabilityData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityBlocks();
  }, [clinicianId, refreshTrigger, startDate, endDate, userTimeZone]);

  // Build day availability map with actual availability hours
  const dayAvailabilityMap = useMemo<Map<string, DayAvailabilityData>>(() => {
    const result = new Map<string, DayAvailabilityData>();
    
    days.forEach(day => {
      const dateStr = TimeZoneService.formatDate(day, 'yyyy-MM-dd');
      const dayStart = day.startOf('day');
      const dayEnd = day.endOf('day');
      
      // Find availability blocks for this day by converting UTC times to user timezone
      console.log(`[useMonthViewData] Processing day: ${dateStr}`, {
        dayStart: dayStart.toISO(),
        dayEnd: dayEnd.toISO(),
        timeZone: userTimeZone
      });
      
      const dayAvailability = availabilityData.filter(block => {
        // Convert UTC timestamps to local time in user's timezone
        const blockStartLocal = TimeZoneService.fromUTC(block.start_at, userTimeZone);
        const blockEndLocal = TimeZoneService.fromUTC(block.end_at, userTimeZone);
        
        // Check if block overlaps with this day
        return (
          (blockStartLocal >= dayStart && blockStartLocal < dayEnd) || // Block starts on this day
          (blockEndLocal > dayStart && blockEndLocal <= dayEnd) || // Block ends on this day
          (blockStartLocal < dayStart && blockEndLocal > dayEnd) // Block spans this day
        );
      });
      
      let hasAvailability = false;
      let displayHours = '';
      
      if (dayAvailability.length > 0) {
        hasAvailability = true;
        
        // Find earliest start and latest end time for the day
        let earliestStart: DateTime | null = null;
        let latestEnd: DateTime | null = null;
        
        dayAvailability.forEach(block => {
          // Convert UTC timestamps to local time
          const blockStartLocal = TimeZoneService.fromUTC(block.start_at, userTimeZone);
          const blockEndLocal = TimeZoneService.fromUTC(block.end_at, userTimeZone);
          
          // Clamp to day boundaries for display purposes
          const startTime = blockStartLocal < dayStart ? dayStart : blockStartLocal;
          const endTime = blockEndLocal > dayEnd ? dayEnd : blockEndLocal;
          
          if (!earliestStart || startTime < earliestStart) {
            earliestStart = startTime;
          }
          
          if (!latestEnd || endTime > latestEnd) {
            latestEnd = endTime;
          }
        });
        
        if (earliestStart && latestEnd) {
          // Format times for display using TimeZoneService
          const startHourFormatted = TimeZoneService.formatTime(earliestStart);
          const endHourFormatted = TimeZoneService.formatTime(latestEnd);
          displayHours = `${startHourFormatted}-${endHourFormatted}`;
        }
      }
      
      result.set(dateStr, { hasAvailability, displayHours });
    });
    
    return result;
  }, [days, availabilityData, userTimeZone]);

  // Map availability blocks to days for lookup - returns multiple blocks per day
  const availabilityByDay = useMemo<Map<string, AvailabilityBlock[]>>(() => {
    const result = new Map<string, AvailabilityBlock[]>();
    
    // Initialize the map with empty arrays for all days
    days.forEach(day => {
      const dateStr = TimeZoneService.formatDate(day, 'yyyy-MM-dd');
      result.set(dateStr, []);
    });
    
    // Process each availability block
    availabilityData.forEach(block => {
      // Convert UTC timestamps to local time
      const blockStartLocal = TimeZoneService.fromUTC(block.start_at, userTimeZone);
      const blockEndLocal = TimeZoneService.fromUTC(block.end_at, userTimeZone);
      
      // Find all days this block applies to
      days.forEach(day => {
        const dateStr = TimeZoneService.formatDate(day, 'yyyy-MM-dd');
        const dayStart = day.startOf('day');
        const dayEnd = day.endOf('day');
        
        // Check if block overlaps with this day
        const overlapsDay = (
          (blockStartLocal >= dayStart && blockStartLocal < dayEnd) || // Block starts on this day
          (blockEndLocal > dayStart && blockEndLocal <= dayEnd) || // Block ends on this day
          (blockStartLocal < dayStart && blockEndLocal > dayEnd) // Block spans this day
        );
        
        if (overlapsDay && result.has(dateStr)) {
          result.get(dateStr)!.push(block);
        }
      });
    });
    
    return result;
  }, [days, availabilityData, userTimeZone]);

  // Map appointments to days for easy lookup with improved debugging
  const dayAppointmentsMap = useMemo<Map<string, Appointment[]>>(() => {
    const result = new Map<string, Appointment[]>();
    console.log(`[useMonthViewData] Processing ${appointments.length} appointments for month view`);
    
    // Create a map of formatted dates to store appointments
    days.forEach(day => {
      // Convert Luxon DateTime to YYYY-MM-DD format string with explicit format
      const dayStr = TimeZoneService.formatDate(day, 'yyyy-MM-dd');
      result.set(dayStr, []);
    });
    
    // Process each appointment with UTC timestamps
    appointments.forEach(appointment => {
      try {
        // If we don't have start_at, skip this appointment
        if (!appointment.start_at) {
          console.error(`[useMonthViewData] Appointment ${appointment.id} has no start_at:`, appointment);
          return;
        }
        
        // Get the local date from the UTC timestamp
        const localStartDateTime = TimeZoneService.fromUTC(appointment.start_at, userTimeZone);
        // Format with explicit format to ensure consistency
        const appointmentLocalDateStr = TimeZoneService.formatDate(localStartDateTime, 'yyyy-MM-dd');
        
        // Log the matching process for debugging
        console.log(`[useMonthViewData] Matching appointment ${appointment.id}:`, {
          startAt: appointment.start_at,
          endAt: appointment.end_at,
          localStartDateTime: localStartDateTime.toISO(),
          formattedDate: appointmentLocalDateStr,
          timeZone: userTimeZone,
          clientName: appointment.clientName, // Access the standardized client name
          hasMatchingDay: result.has(appointmentLocalDateStr)
        });
        
        // Direct map lookup by formatted date string
        if (result.has(appointmentLocalDateStr)) {
          result.get(appointmentLocalDateStr)!.push(appointment);
          console.log(`[useMonthViewData] ✅ Appointment ${appointment.id} matched to ${appointmentLocalDateStr}`);
        } else {
          console.log(`[useMonthViewData] ❌ No matching day found for appointment ${appointment.id} with date ${appointmentLocalDateStr}`);
          
          // Additional debug information to help diagnose the issue
          const closestDays = Array.from(result.keys())
            .sort((a, b) => Math.abs(new Date(a).getTime() - new Date(appointmentLocalDateStr).getTime()) - 
                            Math.abs(new Date(b).getTime() - new Date(appointmentLocalDateStr).getTime()))
            .slice(0, 3);
            
          console.log(`[useMonthViewData] Closest days in calendar: ${closestDays.join(', ')}`);
        }
      } catch (error) {
        console.error(`[useMonthViewData] Error processing appointment ${appointment.id}:`, error);
      }
    });
    
    // Log summary of appointments distribution
    let appointmentCount = 0;
    result.forEach((apps, date) => {
      if (apps.length > 0) {
        console.log(`[useMonthViewData] Date ${date} has ${apps.length} appointments`);
        appointmentCount += apps.length;
      }
    });
    
    console.log(`[useMonthViewData] Total appointments mapped: ${appointmentCount}`);
    
    return result;
  }, [days, appointments, userTimeZone]);

  return {
    loading,
    monthStart,
    days,  // Return the Luxon DateTime objects directly
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  };
};
