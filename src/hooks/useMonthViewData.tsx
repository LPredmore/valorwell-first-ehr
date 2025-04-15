import { useState, useEffect } from 'react';
import { addDays, format, isSameMonth, isSameDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { fromUTCTimestamp, ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { 
  convertClinicianDataToAvailabilityBlocks, 
  getClinicianAvailabilityFieldsQuery 
} from '@/utils/availabilityUtils';

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

  const safeTimeZone = ensureIANATimeZone(userTimeZone);

  useEffect(() => {
    const start = weekViewMode ? startOfWeek(currentDate) : startOfMonth(currentDate);
    const end = weekViewMode ? addDays(startOfWeek(currentDate), 6) : endOfMonth(currentDate);
    
    setMonthStart(start);

    let daysArray: Date[] = [];
    let day = start;
    
    while (day <= end) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    
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
        // Fetch clinician data which includes availability in columns
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select(getClinicianAvailabilityFieldsQuery())
          .eq('id', clinicianId)
          .single();

        if (clinicianError) {
          console.error('Error fetching clinician data:', clinicianError);
          throw clinicianError;
        }

        // Convert clinician data to availability blocks format
        const availabilityData = convertClinicianDataToAvailabilityBlocks(clinicianData);

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

        const availabilityMap = new Map<string, DayAvailabilityData>();
        const availByDay = new Map<string, AvailabilityBlock>();

        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayOfWeek = format(day, 'EEEE');
          
          const dayAvailability = availabilityData?.filter(
            block => block.day_of_week === dayOfWeek && block.is_active
          ) || [];

          if (dayAvailability.length > 0) {
            dayAvailability.sort((a, b) => a.start_time.localeCompare(b.start_time));
            
            availByDay.set(dateStr, dayAvailability[0]);
            
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
    
    const appointmentsMap = new Map<string, Appointment[]>();
    
    appointments.forEach(appointment => {
      const dateKey = appointment.date;
      
      const processedAppointment = { ...appointment };
      
      if (processedAppointment.appointment_datetime) {
        try {
          console.log(`Converting appointment time from UTC for appointment ${processedAppointment.id}`);
          console.log(`Using timezone: ${safeTimeZone}`);
          console.log(`Original UTC timestamp: ${processedAppointment.appointment_datetime}`);
          
          const localDateTime = fromUTCTimestamp(
            processedAppointment.appointment_datetime,
            safeTimeZone
          );
          
          const localTimeString = format(localDateTime, 'HH:mm:ss');
          console.log(`Converted local time: ${localTimeString}`);
          console.log(`Original date field: ${processedAppointment.date}`);
          
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
        }
      } else {
        console.log('No UTC timestamp available for appointment', processedAppointment.id, 'using legacy time fields');
      }
      
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
