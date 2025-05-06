
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

  // SIMPLIFIED: Map appointments to days for easy lookup with improved debugging
  // This is the key part that's been simplified for more reliable appointment display
  const dayAppointmentsMap = useMemo(() => {
    const result = new Map<string, Appointment[]>();
    console.log(`[useMonthViewData] Processing ${appointments.length} appointments for month view`);
    
    // Create a map of formatted dates to store appointments
    days.forEach(day => {
      const dayStr = TimeZoneService.formatDate(day);
      result.set(dayStr, []);
    });
    
    // Process each appointment with simplified date matching
    appointments.forEach(appointment => {
      try {
        // Normalize the appointment date to YYYY-MM-DD format for direct string comparison
        let normalizedDate = appointment.date;
        if (!normalizedDate) {
          console.error(`[useMonthViewData] Appointment has no date:`, appointment.id);
          return;
        }
        
        // Ensure we have a clean YYYY-MM-DD format
        if (normalizedDate.includes('T')) {
          normalizedDate = normalizedDate.split('T')[0];
        }
        
        // Log the matching process for debugging
        console.log(`[useMonthViewData] Matching appointment ${appointment.id}:`, {
          appointmentDate: normalizedDate,
          availableDays: Array.from(result.keys()),
        });
        
        // Direct map lookup by normalized date string - much simpler!
        if (result.has(normalizedDate)) {
          result.get(normalizedDate)!.push(appointment);
          console.log(`[useMonthViewData] ✅ Appointment ${appointment.id} matched to ${normalizedDate}`);
        } else {
          console.log(`[useMonthViewData] ❌ No matching day found for appointment ${appointment.id} with date ${normalizedDate}`);
          
          // Additional attempt: try parsing with DateTime just in case
          try {
            const parsedDate = TimeZoneService.fromDateString(appointment.date);
            const formattedDate = TimeZoneService.formatDate(parsedDate);
            
            if (result.has(formattedDate)) {
              result.get(formattedDate)!.push(appointment);
              console.log(`[useMonthViewData] ✅ Appointment ${appointment.id} matched to ${formattedDate} after parsing`);
            }
          } catch (e) {
            console.error(`[useMonthViewData] Failed to parse date alternative:`, e);
          }
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
