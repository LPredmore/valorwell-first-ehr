
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';
import { AvailabilityBlock } from '@/types/availability';
import { ClientDetails } from '@/types/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DebugUtils } from '@/utils/debugUtils';
import { TimeBlock, AppointmentBlock, AvailabilityException } from './types';

// Debug context name for this component
const DEBUG_CONTEXT = 'useWeekViewData';

// Use ClientDetails as Client for backward compatibility
type Client = ClientDetails;

// Main hook for week view data processing
export const useWeekViewData = (
  days: Date[],
  clinicianId: string | null,
  refreshTrigger = 0,
  externalAppointments: Appointment[] = [],
  getClientName = (id: string) => `Client ${id}`,
  userTimeZone: string
) => {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Map<string, Client>>(new Map());
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);

  // Convert JS Date array to DateTime array in user timezone
  const weekDays = useMemo(() => 
    days.map(day => TimeZoneService.fromJSDate(day, userTimeZone)),
    [days, userTimeZone]
  );

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
        setExceptions([]);
        setTimeBlocks([]);
        setAppointmentBlocks([]);
        setLoading(false);
        return;
      }

      try {
        // Use the first day to determine the week
        const firstDay = weekDays[0] || TimeZoneService.now(userTimeZone);
        
        // Get expanded date range for better data capture - add padding
        // Start a week before the displayed week, end a week after
        const padStartDay = firstDay.minus({ days: 7 });
        const padEndDay = firstDay.plus({ days: 21 }); // current week (7) + padding (14)
        
        // UTC date bounds with expanded range
        const utcStart = padStartDay.toUTC().toISO();
        const utcEnd = padEndDay.toUTC().toISO();

        console.log('[useWeekViewData] Fetching for week:', {
          localStart: firstDay.toISO(),
          paddedStart: padStartDay.toISO(),
          paddedEnd: padEndDay.toISO(),
          utcStart,
          utcEnd,
          tz: userTimeZone
        });

        // Fetch all required data in parallel
        const [appointmentData, availabilityData, clientData, exceptionData] = await Promise.all([
          // Fetch appointments if no external appointments provided
          externalAppointments.length === 0 && clinicianId ? supabase
            .from('appointments')
            .select('*')
            .eq('clinician_id', clinicianId)
            .gte('start_at', utcStart)
            .lt('end_at', utcEnd)  // Fix: use end_at for the upper boundary
            .order('start_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
          
          // Fetch availability blocks - FIXED: Corrected the query logic
          clinicianId ? supabase
            .from('availability_blocks')
            .select('*')
            .eq('clinician_id', clinicianId)
            .gte('start_at', utcStart)
            .lt('end_at', utcEnd)   // This is correct logic: blocks starting in our range
            .order('start_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
          
          // Fetch client data once
          clinicianId ? supabase
            .from('clients')
            .select('id, client_first_name, client_last_name, client_preferred_name')
            .eq('clinician_id', clinicianId) : Promise.resolve({ data: [], error: null }),
            
          // Fetch availability exceptions
          clinicianId ? supabase
            .from('availability_exceptions')
            .select('*')
            .eq('clinician_id', clinicianId) : Promise.resolve({ data: [], error: null })
        ]);

        // Process appointments - use external if provided, otherwise use fetched
        const fetchedAppts = externalAppointments.length > 0 
          ? externalAppointments 
          : (appointmentData.error ? [] : appointmentData.data);
          
        console.log('[useWeekViewData] Using Appointments:', {
          count: fetchedAppts.length,
          source: externalAppointments.length > 0 ? 'external' : 'database',
          sample: fetchedAppts.length ? fetchedAppts[0] : null,
          tz: userTimeZone
        });

        // Process availability
        const fetchedBlocks = availabilityData.error ? [] : availabilityData.data;
        console.log('[useWeekViewData] Fetched blocks:', {
          tz: userTimeZone,
          blocksCount: fetchedBlocks.length
        });

        // Process exceptions
        const fetchedExceptions = exceptionData.error ? [] : exceptionData.data;
        console.log('[useWeekViewData] Fetched exceptions:', {
          count: fetchedExceptions.length
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
        setExceptions(fetchedExceptions);
        
        // Process time blocks and appointment blocks
        processTimeBlocks(fetchedBlocks, fetchedExceptions);
        processAppointmentBlocks(fetchedAppts, clientMap);
        
      } catch (error) {
        console.error('[useWeekViewData] Unexpected Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicianId, refreshTrigger, userTimeZone, externalAppointments]);

  // Process availability blocks into time blocks
  const processTimeBlocks = (blocks: AvailabilityBlock[], exceptions: AvailabilityException[]) => {
    console.log('[useWeekViewData] Processing time blocks', {
      blocksCount: blocks.length,
      exceptionsCount: exceptions.length
    });
    
    const timeBlocks: TimeBlock[] = [];
    
    // Process regular availability blocks
    blocks.forEach(block => {
      if (!block.start_at || !block.end_at) {
        console.warn('[useWeekViewData] Invalid availability block', {
          blockId: block.id,
          startAt: block.start_at,
          endAt: block.end_at
        });
        return;
      }
      
      try {
        const start = DateTime.fromISO(block.start_at, { zone: 'UTC' }).setZone(userTimeZone);
        const end = DateTime.fromISO(block.end_at, { zone: 'UTC' }).setZone(userTimeZone);
        const day = start.startOf('day');
        
        timeBlocks.push({
          start,
          end,
          day,
          availabilityIds: [block.id],
          isException: false,
          isStandalone: false
        });
        
        console.log('[useWeekViewData] Created time block', {
          blockId: block.id,
          start: start.toFormat('yyyy-MM-dd HH:mm'),
          end: end.toFormat('yyyy-MM-dd HH:mm'),
          day: day.toFormat('yyyy-MM-dd')
        });
      } catch (error) {
        console.error('[useWeekViewData] Error creating time block', {
          blockId: block.id,
          error
        });
      }
    });
    
    // Process exceptions (simplified for now)
    exceptions.forEach(exception => {
      if (exception.is_deleted || !exception.start_time || !exception.end_time) {
        return;
      }
      
      try {
        // Create a DateTime from the specific date and time
        const specificDate = DateTime.fromISO(exception.specific_date, { zone: userTimeZone });
        const startTime = exception.start_time.split(':').map(Number);
        const endTime = exception.end_time.split(':').map(Number);
        
        const start = specificDate.set({
          hour: startTime[0] || 0,
          minute: startTime[1] || 0,
          second: 0,
          millisecond: 0
        });
        
        const end = specificDate.set({
          hour: endTime[0] || 0,
          minute: endTime[1] || 0,
          second: 0,
          millisecond: 0
        });
        
        timeBlocks.push({
          start,
          end,
          day: start.startOf('day'),
          availabilityIds: [exception.id],
          isException: true,
          isStandalone: true
        });
      } catch (error) {
        console.error('[useWeekViewData] Error processing exception', {
          exceptionId: exception.id,
          error
        });
      }
    });
    
    setTimeBlocks(timeBlocks);
    console.log('[useWeekViewData] Finished processing time blocks', {
      totalBlocks: timeBlocks.length
    });
  };
  
  // Process appointments into appointment blocks - FIXED to handle timezone boundaries
  const processAppointmentBlocks = (appts: Appointment[], clientMap: Map<string, Client>) => {
    console.log('[useWeekViewData] Processing appointment blocks', {
      appointmentsCount: appts.length,
      clientsCount: clientMap.size,
      dayKeys
    });
    
    const appointmentBlocks: AppointmentBlock[] = [];
    
    appts.forEach(appointment => {
      if (!appointment.start_at || !appointment.end_at) {
        console.warn('[useWeekViewData] Invalid appointment', {
          appointmentId: appointment.id,
          startAt: appointment.start_at,
          endAt: appointment.end_at
        });
        return;
      }
      
      try {
        // Convert start/end times to the user's timezone
        const start = DateTime.fromISO(appointment.start_at, { zone: 'UTC' }).setZone(userTimeZone);
        const end = DateTime.fromISO(appointment.end_at, { zone: 'UTC' }).setZone(userTimeZone);
        const day = start.startOf('day');
        
        // Get client name
        let clientName = appointment.clientName;
        if (!clientName) {
          const client = clientMap.get(appointment.client_id);
          if (client) {
            clientName = client.client_preferred_name || 
                        `${client.client_first_name} ${client.client_last_name}`;
          } else {
            clientName = getClientName(appointment.client_id);
          }
        }
        
        // Get formatted date for logging
        const dayStr = day.toFormat('yyyy-MM-dd');
        
        // Check if this appointment's day is in our view
        // NEW: We no longer filter by day - we'll show all appointments in the data range
        // Visibility will be controlled by the TimeSlot component
        
        appointmentBlocks.push({
          id: appointment.id,
          start,
          end,
          day,
          clientId: appointment.client_id,
          clientName,
          type: appointment.type
        });
        
        console.log('[useWeekViewData] Created appointment block', {
          appointmentId: appointment.id,
          clientName,
          start: start.toFormat('yyyy-MM-dd HH:mm'),
          end: end.toFormat('yyyy-MM-dd HH:mm'),
          day: dayStr,
          inView: dayKeys.includes(dayStr)
        });
      } catch (error) {
        console.error('[useWeekViewData] Error creating appointment block', {
          appointmentId: appointment.id,
          error
        });
      }
    });
    
    setAppointmentBlocks(appointmentBlocks);
    console.log('[useWeekViewData] Finished processing appointment blocks', {
      totalBlocks: appointmentBlocks.length
    });
  };

  // Map appointments by day for the week
  const dayAppointmentsMap = useMemo(() => {
    const resultMap = new Map<string, Appointment[]>();
    
    dayKeys.forEach(key => resultMap.set(key, []));
    
    // Map appointments to days
    appointments.forEach(appointment => {
      try {
        // UTC to local conversion
        const slotTime = DateTime.fromISO(appointment.start_at).setZone(userTimeZone);
        const dayStr = slotTime.toFormat('yyyy-MM-dd');
        
        if (resultMap.has(dayStr)) {
          const existing: Appointment[] = resultMap.get(dayStr) || [];
          resultMap.set(dayStr, [...existing, appointment]);
        }
      } catch (error) {
        console.error('[useWeekViewData] Error mapping appointment to day', {
          appointmentId: appointment.id,
          error
        });
      }
    });
    
    return resultMap;
  }, [appointments, dayKeys, userTimeZone]);

  // Map availability by day with clinician time zone
  const dayAvailabilityMap = useMemo(() => {
    const resultMap = new Map<string, AvailabilityBlock[]>();
    console.log('[useWeekViewData] Processing Blocks:', {
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
  }, [availability, dayKeys, userTimeZone]);

  // Utility function to check if a time slot is available
  const isTimeSlotAvailable = (day: Date, timeSlot: Date): boolean => {
    // Convert JS Date to DateTime
    const dayDt = DateTime.fromJSDate(day, { zone: userTimeZone });
    const timeSlotDt = DateTime.fromJSDate(timeSlot, { zone: userTimeZone });
    
    // Check if the time slot falls within any time block
    const isAvailable = timeBlocks.some(block => {
      const isSameDay = block.day?.hasSame(dayDt, 'day') || false;
      if (!isSameDay) return false;
      
      const slotTime = dayDt.set({
        hour: timeSlotDt.hour,
        minute: timeSlotDt.minute,
        second: 0,
        millisecond: 0
      });
      
      return slotTime >= block.start && slotTime < block.end;
    });
    
    return isAvailable;
  };

  // Utility function to get the block for a time slot
  const getBlockForTimeSlot = (day: Date, timeSlot: Date): TimeBlock | undefined => {
    // Convert JS Date to DateTime
    const dayDt = DateTime.fromJSDate(day, { zone: userTimeZone });
    const timeSlotDt = DateTime.fromJSDate(timeSlot, { zone: userTimeZone });
    
    // Find the block that contains this time slot
    return timeBlocks.find(block => {
      const isSameDay = block.day?.hasSame(dayDt, 'day') || false;
      if (!isSameDay) return false;
      
      const slotTime = dayDt.set({
        hour: timeSlotDt.hour,
        minute: timeSlotDt.minute,
        second: 0,
        millisecond: 0
      });
      
      return slotTime >= block.start && slotTime < block.end;
    });
  };

  // Utility function to get the appointment for a time slot
  const getAppointmentForTimeSlot = (day: Date, timeSlot: Date): AppointmentBlock | undefined => {
    // Convert JS Date to DateTime
    const dayDt = DateTime.fromJSDate(day, { zone: userTimeZone });
    const timeSlotDt = DateTime.fromJSDate(timeSlot, { zone: userTimeZone });
    
    // Find the appointment that contains this time slot
    return appointmentBlocks.find(appt => {
      const isSameDay = appt.day?.hasSame(dayDt, 'day') || false;
      if (!isSameDay) return false;
      
      const slotTime = dayDt.set({
        hour: timeSlotDt.hour,
        minute: timeSlotDt.minute,
        second: 0,
        millisecond: 0
      });
      
      return slotTime >= appt.start && slotTime < appt.end;
    });
  };

  // Utility function to get availability for a block
  const getAvailabilityForBlock = (blockId: string): AvailabilityBlock | undefined => {
    return availability.find(block => block.id === blockId);
  };

  return {
    loading,
    weekDays,
    dayKeys,
    dayAppointmentsMap,
    dayAvailabilityMap,
    availabilityData: availability,
    appointmentsData: appointments,
    timeBlocks,
    exceptions,
    availabilityBlocks: availability,
    appointmentBlocks,
    getAvailabilityForBlock,
    isTimeSlotAvailable,
    getBlockForTimeSlot,
    getAppointmentForTimeSlot,
  };
};
