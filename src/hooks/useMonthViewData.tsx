import { useState, useEffect } from 'react';
import { addDays, format, isSameMonth, isSameDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { fromUTCTimestamp, ensureIANATimeZone } from '@/utils/timeZoneUtils';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  appointment_datetime?: string; // UTC timestamp
  appointment_end_datetime?: string; // UTC end timestamp
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

interface DayAvailabilityData {
  hasAvailability: boolean;
  isModified: boolean;
  displayHours: string;
}

export const useMonthViewData = (
  currentDate: Date,
  clinicianId: string | null,
  refreshTrigger: number = 0,
  existingAppointments: Appointment[] = [],
  weekViewMode: boolean = false,
  userTimeZone: string = 'America/Chicago'
) => {
  const [loading, setLoading] = useState(true);
  const [monthStart, setMonthStart] = useState(startOfMonth(currentDate));
  const [days, setDays] = useState<Date[]>([]);
  const [dayAvailabilityMap, setDayAvailabilityMap] = useState(new Map<string, DayAvailabilityData>());
  const [dayAppointmentsMap, setDayAppointmentsMap] = useState(new Map<string, Appointment[]>());
  const [availabilityByDay, setAvailabilityByDay] = useState(new Map<string, AvailabilityBlock>());
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeOffBlocks, setTimeOffBlocks] = useState<any[]>([]);

  // Ensure valid timezone
  const safeTimeZone = ensureIANATimeZone(userTimeZone);

  useEffect(() => {
    // Generate days for the month or week
    const start = weekViewMode ? startOfWeek(currentDate) : startOfMonth(currentDate);
    const end = weekViewMode ? addDays(startOfWeek(currentDate), 6) : endOfMonth(currentDate);
    
    setMonthStart(start);

    // Create array of dates
    let daysArray: Date[] = [];
    let day = start;
    
    while (day <= end) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    
    // If not in week mode and not starting on Sunday, add days from previous month to fill week
    if (!weekViewMode) {
      const startDay = start.getDay();
      if (startDay !== 0) {
        const previousDays = [];
        for (let i = 0; i < startDay; i++) {
          const prevDay = addDays(start, -i - 1);
          previousDays.unshift(prevDay);
        }
        daysArray = [...previousDays, ...daysArray];
      }

      // Add days from next month to complete the grid (maximum 6 weeks)
      const endDay = end.getDay();
      if (endDay !== 6) {
        const nextDays = [];
        for (let i = 0; i < (6 - endDay); i++) {
          const nextDay = addDays(end, i + 1);
          nextDays.push(nextDay);
        }
        daysArray = [...daysArray, ...nextDays];
      }
    }

    setDays(daysArray);
  }, [currentDate, weekViewMode]);

  useEffect(() => {
    const fetchAvailabilityData = async () => {
      if (!clinicianId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch availability data for the clinician
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('*')
          .eq('clinician_id', clinicianId);

        if (availabilityError) {
          throw availabilityError;
        }

        // Fetch time-off blocks for the clinician
        const { data: timeOffData, error: timeOffError } = await supabase
          .from('time_off_blocks')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_active', true);

        if (timeOffError) {
          throw timeOffError;
        }

        setAvailabilityBlocks(availabilityData || []);
        setTimeOffBlocks(timeOffData || []);

        // Process the data to create day availability map
        const availabilityMap = new Map<string, DayAvailabilityData>();
        const availByDay = new Map<string, AvailabilityBlock>();

        // Process each day in the month or week
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayOfWeek = format(day, 'EEEE');
          
          // Find availability blocks for this day of week
          const dayAvailability = availabilityData?.filter(
            block => block.day_of_week === dayOfWeek && block.is_active
          ) || [];

          if (dayAvailability.length > 0) {
            // Sort by start time
            dayAvailability.sort((a, b) => a.start_time.localeCompare(b.start_time));
            
            // Store the first block for quick reference
            availByDay.set(dateStr, dayAvailability[0]);
            
            // Format display hours
            const displayHours = dayAvailability
              .map(block => `${block.start_time.substring(0, 5)}-${block.end_time.substring(0, 5)}`)
              .join(', ');
            
            availabilityMap.set(dateStr, {
              hasAvailability: true,
              isModified: false,
              displayHours
            });
          } else {
            availabilityMap.set(dateStr, {
              hasAvailability: false,
              isModified: false,
              displayHours: ''
            });
          }
        });

        setDayAvailabilityMap(availabilityMap);
        setAvailabilityByDay(availByDay);

        // Process appointments
        processAppointments(existingAppointments);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (days.length > 0) {
      fetchAvailabilityData();
    }
  }, [days, clinicianId, refreshTrigger]);

  const processAppointments = (appointments: Appointment[]) => {
    console.log(`Processing ${appointments.length} appointments with timezone: ${safeTimeZone}`);
    
    // Group appointments by date
    const appointmentsMap = new Map<string, Appointment[]>();
    
    appointments.forEach(appointment => {
      // Date key for mapping
      const dateKey = appointment.date;
      
      // Make a copy of the appointment to avoid mutating the original
      const processedAppointment = { ...appointment };
      
      // If we have UTC timestamps, use them to compute the correct display time
      // in the user's timezone
      if (processedAppointment.appointment_datetime) {
        try {
          console.log(`Converting appointment time from UTC for appointment ${processedAppointment.id}`);
          console.log(`Using timezone: ${safeTimeZone}`);
          console.log(`Original UTC timestamp: ${processedAppointment.appointment_datetime}`);
          
          // Convert UTC timestamp to user's timezone for display
          const localDateTime = fromUTCTimestamp(
            processedAppointment.appointment_datetime,
            safeTimeZone
          );
          
          // Format the local time for display (but keep the original fields too)
          const localTimeString = format(localDateTime, 'HH:mm:ss');
          console.log(`Converted local time: ${localTimeString}`);
          console.log(`Original date field: ${processedAppointment.date}`);
          
          // Override the start_time with the timezone-adjusted time for display
          processedAppointment.start_time = localTimeString;
          
          if (processedAppointment.appointment_end_datetime) {
            const localEndDateTime = fromUTCTimestamp(
              processedAppointment.appointment_end_datetime,
              safeTimeZone
            );
            processedAppointment.end_time = format(localEndDateTime, 'HH:mm:ss');
          }
        } catch (error) {
          console.error('Error converting appointment time for display:', error);
          // Keep original times if conversion fails
        }
      } else {
        console.log('No UTC timestamp available for appointment', processedAppointment.id, 'using legacy time fields');
      }
      
      // Add to the map
      if (!appointmentsMap.has(dateKey)) {
        appointmentsMap.set(dateKey, []);
      }
      appointmentsMap.get(dateKey)!.push(processedAppointment);
    });
    
    console.log(`Processed appointments map with ${appointmentsMap.size} dates`);
    setDayAppointmentsMap(appointmentsMap);
  };

  useEffect(() => {
    if (existingAppointments.length > 0) {
      processAppointments(existingAppointments);
    }
  }, [existingAppointments, safeTimeZone]);

  const fetchAvailabilitySettings = async (clinicianId) => {
    try {
      console.log('[MonthView] Fetching availability settings for clinician:', clinicianId);
      const { data: settingsData, error: settingsError } = await supabase.functions.invoke('get-availability-settings', {
        body: { clinicianId }
      });
      
      if (settingsError) {
        console.error('[MonthView] Error fetching availability settings:', settingsError);
      } else if (settingsData) {
        console.log('[MonthView] Received availability settings:', settingsData);
        // Process the settings data as needed
      }
    } catch (error) {
      console.error('[MonthView] Error fetching availability settings:', error);
    }
  };

  return {
    loading,
    monthStart,
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay,
  };
};
