
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  clinician_id?: string;
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
    
    return {
      monthStart,
      days,
      startDate,
      endDate
    };
  }, [currentDateTime]);

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

        console.log(`[useMonthViewData] Fetching availability for clinician: ${clinicianId}`);
        
        // Fetch the clinician data directly
        const { data: clinician, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', clinicianId)
          .single();

        if (error) {
          console.error('[useMonthViewData] Error fetching clinician data:', error);
          setAvailabilityData([]);
        } else {
          console.log('[useMonthViewData] Fetched clinician data:', clinician?.id);
          
          // Extract availability blocks from clinician record
          const extractedBlocks = extractAvailabilityBlocksFromClinician(clinician);
          setAvailabilityData(extractedBlocks);
        }
      } catch (error) {
        console.error('[useMonthViewData] Error fetching availability:', error);
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
    
    console.log(`[useMonthViewData] Extracted ${blocks.length} availability blocks`);
    return blocks;
  };

  // Build day availability map with standardized display hours
  const dayAvailabilityMap = useMemo(() => {
    const result = new Map<string, {
      hasAvailability: boolean,
      displayHours: string
    }>();
    
    days.forEach(day => {
      const dayOfWeek = day.toFormat('EEEE');
      const dateStr = TimeZoneService.formatDate(day);
      
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
          
          const startHourFormatted = TimeZoneService.formatTime(startTimeInUserZone);
          const endHourFormatted = TimeZoneService.formatTime(endTimeInUserZone);
          
          displayHours = `${startHourFormatted}-${endHourFormatted}`;
        } catch (error) {
          console.error('[useMonthViewData] Error formatting time for availability:', error);
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
      const dayOfWeek = day.toFormat('EEEE');
      const dateStr = TimeZoneService.formatDate(day);
      
      const firstAvailability = availabilityData.find(
        slot => slot.day_of_week === dayOfWeek
      );
      
      if (firstAvailability) {
        result.set(dateStr, firstAvailability);
      }
    });
    
    return result;
  }, [days, availabilityData]);

  // Map appointments to days for easy lookup with improved debugging
  const dayAppointmentsMap = useMemo(() => {
    const result = new Map<string, Appointment[]>();
    console.log(`[useMonthViewData] Processing ${appointments.length} appointments for month view`);
    
    // Log sample appointment if available for debugging
    if (appointments.length > 0) {
      const sampleAppointment = appointments[0];
      // Log raw appointment data
      console.log('[useMonthViewData] Raw sample appointment:', {
        id: sampleAppointment.id,
        date: sampleAppointment.date,
        clinician_id: sampleAppointment.clinician_id,
        format: typeof sampleAppointment.date
      });
      
      // Log normalized date for comparison using TimeZoneService
      const normalizedDate = TimeZoneService.formatDate(
        TimeZoneService.fromDateString(sampleAppointment.date)
      );
      
      console.log('[useMonthViewData] Normalized sample appointment date:', {
        original: sampleAppointment.date,
        normalized: normalizedDate
      });
    }
    
    days.forEach(day => {
      const dayStr = TimeZoneService.formatDate(day);
      
      // Add explicit filtering with logging and date normalization
      const dayAppointments = appointments.filter(appointment => {
        // Normalize both dates to yyyy-MM-dd format before comparison using TimeZoneService
        const appointmentDateNormalized = TimeZoneService.formatDate(
          TimeZoneService.fromDateString(appointment.date)
        );
        
        const match = appointmentDateNormalized === dayStr;
        
        // Log date comparison details for the first few appointments
        if (appointments.indexOf(appointment) < 3) {
          console.log(`[useMonthViewData] Comparing date: "${appointment.date}" (normalized: "${appointmentDateNormalized}") === "${dayStr}" => ${match}`);
        }
        
        return match;
      });
      
      if (dayAppointments.length > 0) {
        console.log(`[useMonthViewData] Found ${dayAppointments.length} appointments for ${dayStr}`);
      }
      
      result.set(dayStr, dayAppointments);
    });
    
    // Log counts of days with appointments
    const daysWithAppointments = Array.from(result.entries())
      .filter(([_, apps]) => apps.length > 0)
      .length;
    
    console.log(`[useMonthViewData] Created map with appointments on ${daysWithAppointments} days`);
    
    return result;
  }, [days, appointments]);

  return {
    loading,
    monthStart,
    days: days.map(d => d.toJSDate()), // Convert DateTime objects back to JS Dates for compatibility
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  };
};
