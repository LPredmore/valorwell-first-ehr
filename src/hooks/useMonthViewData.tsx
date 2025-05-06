import { useState, useEffect } from 'react';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';

export const useMonthViewData = (
  currentDate: Date,
  clinicianId: string | null,
  refreshTrigger: number = 0,
  appointments: Appointment[] = [],
  userTimeZone: string = 'America/Chicago'
) => {
  const [loading, setLoading] = useState(true);
  const [monthStart, setMonthStart] = useState<Date | DateTime>(currentDate);
  const [days, setDays] = useState<DateTime[]>([]);
  const [dayAvailabilityMap, setDayAvailabilityMap] = useState(new Map<string, any[]>());
  const [dayAppointmentsMap, setDayAppointmentsMap] = useState(new Map<string, Appointment[]>());
  const [availabilityByDay, setAvailabilityByDay] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    setLoading(true);
    
    // Use TimeZoneService to get the start of the month in the user's timezone
    const startOfMonth = TimeZoneService.startOfMonth(TimeZoneService.fromJSDate(currentDate, userTimeZone));
    setMonthStart(startOfMonth);
    
    // Generate the days array using TimeZoneService
    const start = TimeZoneService.startOfWeek(startOfMonth, 0);
    const end = TimeZoneService.endOfWeek(TimeZoneService.endOfMonth(startOfMonth), 0);
    const generatedDays = TimeZoneService.eachDayOfInterval(start, end);
    setDays(generatedDays);
    
    setLoading(false);
  }, [currentDate, userTimeZone]);

  useEffect(() => {
    // Process appointments whenever appointments or days change
    const appointmentsMap = processAppointments(appointments);
    setDayAppointmentsMap(appointmentsMap);
  }, [appointments, days, userTimeZone]);

  // Helper function to map appointments to days
  const processAppointments = (appointments: Appointment[]): Map<string, Appointment[]> => {
    const result = new Map<string, Appointment[]>();
    
    // Initialize the map with empty arrays for each day
    days.forEach(day => {
      const dayStr = TimeZoneService.formatDate(day);
      result.set(dayStr, []);
    });

    // Add appointments to their respective days
    appointments.forEach(appointment => {
      try {
        // Convert UTC timestamp to local date in user's timezone
        const startDateTime = TimeZoneService.fromUTC(appointment.start_at, userTimeZone);
        
        // Format to YYYY-MM-DD for map lookup
        const dateStr = TimeZoneService.formatDate(startDateTime);
        
        if (result.has(dateStr)) {
          result.get(dateStr)!.push(appointment);
        } else {
          console.log(`[useMonthViewData] No matching day found for appointment ${appointment.id} with date ${dateStr}`);
        }
      } catch (error) {
        console.error(`[useMonthViewData] Error processing appointment ${appointment.id}:`, error);
      }
    });

    return result;
  };

  useEffect(() => {
    // Fetch availability data from Supabase
    const fetchAvailability = async () => {
      if (!clinicianId) {
        console.log('[useMonthViewData] No clinicianId provided, skipping availability fetch');
        return;
      }
      
      setLoading(true);
      
      try {
        const availabilityData: { [key: string]: any[] } = {};
        
        for (const day of days) {
          const dayOfWeek = TimeZoneService.formatDateTime(day, 'EEEE');
          
          const { data, error } = await supabase
            .from('availability')
            .select('*')
            .eq('clinician_id', clinicianId)
            .eq('day_of_week', dayOfWeek);
          
          if (error) {
            console.error(`[useMonthViewData] Error fetching availability for ${dayOfWeek}:`, error);
          } else {
            const dayStr = TimeZoneService.formatDate(day);
            availabilityData[dayStr] = data || [];
          }
        }
        
        setAvailabilityByDay(availabilityData);
      } catch (error) {
        console.error('[useMonthViewData] Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [clinicianId, days, refreshTrigger]);

  useEffect(() => {
    // Map availability data to days
    const mapAvailabilityToDays = () => {
      const newMap = new Map<string, any[]>();
      
      days.forEach(day => {
        const dayStr = TimeZoneService.formatDate(day);
        newMap.set(dayStr, availabilityByDay[dayStr] || []);
      });
      
      setDayAvailabilityMap(newMap);
    };
    
    mapAvailabilityToDays();
  }, [availabilityByDay, days]);

  return {
    loading,
    monthStart,
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  };
};
