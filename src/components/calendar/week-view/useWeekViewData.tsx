import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';
import { AvailabilityBlock } from '@/types/availability';
import { Client } from '@/types/client';
import { TimeZoneService } from '@/utils/timeZoneService';

// Input props interface for hook
export interface UseWeekViewDataProps {
  currentDate: Date;
  clinicianId: string | null;
  userTimeZone: string;
  refreshTrigger?: number;
}

// Main hook for week view data processing
export const useWeekViewData = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  userTimeZone,
}: UseWeekViewDataProps) => {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Map<string, Client>>(new Map());

  // Ensure current date is in clinician's time zone
  const localDate = useMemo(() => 
    TimeZoneService.fromJSDate(currentDate, userTimeZone),
    [currentDate, userTimeZone]
  );

  // Generate days for the current week
  const weekDays = useMemo(() => {
    const days: DateTime[] = [];
    const weekStart = localDate.startOf('week');
    for (let i = 0; i < 7; i++) {
      days.push(weekStart.plus({ days: i }));
    }
    return days;
  }, [localDate]);

  // Format day strings ('yyyy-MM-dd') for mapping
  const dayKeys = useMemo(() => 
    weekDays.map(day => day.toFormat('yyyy-MM-dd')),
    [weekDays]
  );

  // Fetch clinician appointments and availability
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      if (!clinicianId) {
        setAppointments([]);
        setAvailability([]);
        setClients(new Map());
        setLoading(false);
        return;
      }

      try {
        // UTC date bounds for current week
        const utcStart = DateTime.utc(
          localDate.year,
          localDate.month,
          localDate.day
        ).startOf('week').toISO();

        const utcEnd = DateTime.utc(
          localDate.year,
          localDate.month,
          localDate.day
        ).endOf('week').toISO();

        console.log('[useWeekViewData] Fetching for week:', {
          localStart: localDate.startOf('week').toISO(),
          utcStart,
          utcEnd,
          tz: userTimeZone
        });

        // Fetch all required data in parallel
        const [appointmentData, availabilityData, clientData] = await Promise.all([
          // Fetch appointments
          clinicianId ? supabase
            .from('appointments')
            .select('*')
            .eq('clinician_id', clinicianId)
            .gte('start_at', utcStart)
            .lt('end_at', utcEnd)
            .order('start_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
          
          // Fetch availability blocks
          clinicianId ? supabase
            .from('availability_blocks')
            .select('*')
            .eq('clinician_id', clinicianId)
            .gte('end_at', utcStart)
            .lt('start_at', utcEnd)
            .order('start_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
          
          // Fetch client data once
          clinicianId ? supabase
            .from('clients')
            .select('id, client_first_name, client_last_name, client_preferred_name')
            .eq('clinician_id', clinicianId) : Promise.resolve({ data: [], error: null })
        ]);

        // Process appointments
        const fetchedAppts = appointmentData.error ? [] : appointmentData.data;
        console.log('[useWeekViewData] Fetched Appointments:', {
          count: fetchedAppts.length,
          sample: fetchedAppts.length ? fetchedAppts[0] : null,
          tz: userTimeZone
        });

        // Process availability
        const fetchedBlocks = availabilityData.error ? [] : availabilityData.data;
        console.log('[useWeekViewData] Fetched blocks:', {
          tz: userTimeZone,
          startRange: localDate.startOf('week').endOf('day').diffNow('days').days,
          blocksCount: fetchedBlocks.length
        });

        // Build client map
        const clientMap = new Map<string, Client>();
        (clientData.data || []).forEach(client => {
          clientMap.set(client.id, client);
          console.log('[useWeekViewData] Client loaded:', {
            id: client.id,
            name: client.client_first_name
          });
        });

        setAppointments(fetchedAppts);
        setAvailability(fetchedBlocks);
        setClients(clientMap);
      } catch (error) {
        console.error('[useWeekViewData] Unexpected Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicianId, refreshTrigger, userTimeZone]);

  // Map appointments by day for the week
  const dayAppointmentsMap = useMemo(() => {
    const resultMap = new Map<string, Appointment[]>();
    
    dayKeys.forEach(key => resultMap.set(key, []));
    
    // Sample appointment timestamp from calendar
    const sample = appointments.length ? appointments[0]?.start_at : null;
    
    dayKeys.forEach((key) => {
      appointments.forEach(appointment => {
        // UTC to local string: '2025-05-07T03:00:00+00:00' -> '2025-05-06 22:00 CDT
        const slotTime = DateTime.fromISO(appointment.start_at).setZone(userTimeZone);
        const dayStr = key === '2025-05-12' && slotTime.hasSame('2025-05-13', 'day') ? key : slotTime.toFormat('yyyy-MM-dd');
        
        if (resultMap.has(dayStr)) {
          const existing: Appointment[] = resultMap.get(dayStr) || [];
          resultMap.set(dayStr, [...existing, appointment]);
        }
      });
...
    });
    
    return resultMap;
  }, [appointments, dayKeys, userTimeZone]);

  // Map availability by day with clinician time zone
  const dayAvailabilityMap = useMemo(() => {
    const resultMap = new Map<string, AvailabilityBlock[]>();
    console.warn('[useWeekViewData] Processing Blocks:', {
      blockCount: availability.length,
      sampleBlock: availability[0],
      userTime: userTimeZone
    });
    
    dayKeys.forEach(key => resultMap.set(key, []));
    
    availability.forEach(block => {
      // UTC->local conversion with time zone
      const blockTime = block.start_at ? DateTime.fromISO(block.start_at).setZone(userTimeZone) : null;
      const dayStr = blockTime ? blockTime.toFormat('yyyy-MM-dd') : '';
      
      if (dayStr && resultMap.has(dayStr)) {
        const existing = resultMap.get(dayStr) || [];
        resultMap.set(dayStr, [...existing, block]);
      }
    });

    return resultMap;
  }, [availability, dayKeys]);

  return {
    loading,
    weekDays,
    dayKeys,
    dayAppointmentsMap,
    dayAvailabilityMap,
    availabilityData: availability,
    appointmentsData: appointments,
  };
};