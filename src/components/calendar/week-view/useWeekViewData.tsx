
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
  isStandalone?: boolean;
}

interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string | null;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id: string;
}

interface TimeBlock {
  day: DateTime;
  start: DateTime;
  end: DateTime;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
}

interface AppointmentBlock {
  id: string;
  day: DateTime;
  start: DateTime;
  end: DateTime;
  clientId: string;
  type: string;
  clientName?: string;
}

// Convert TimeBlock to JS Date compatible version for external use
interface JSTimeBlock {
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
}

// Convert AppointmentBlock to JS Date compatible version for external use
interface JSAppointmentBlock {
  id: string;
  day: Date;
  start: Date;
  end: Date;
  clientId: string;
  type: string;
  clientName?: string;
}

export const useWeekViewData = (
  days: Date[],
  clinicianId: string | null,
  refreshTrigger: number = 0,
  appointments: Appointment[] = [],
  getClientName: (clientId: string) => string = () => 'Client',
  userTimeZone: string = 'America/Chicago'
) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);

  // Convert days array to DateTime objects
  const daysAsDateTime = useMemo(() => {
    return days.map(day => TimeZoneService.fromJSDate(day, userTimeZone));
  }, [days, userTimeZone]);

  // Process appointments using UTC timestamps
  useEffect(() => {
    if (!appointments || !appointments.length) {
      setAppointmentBlocks([]);
      console.log("[useWeekViewData] No appointments to process");
      return;
    }

    console.log(`[useWeekViewData] Processing ${appointments.length} appointments with timezone: ${userTimeZone}`);
    
    try {
      // Create a map of formatted dates for quick lookup
      const formattedDayMap = new Map<string, DateTime>();
      daysAsDateTime.forEach(day => {
        const formattedDate = TimeZoneService.formatDate(day);
        formattedDayMap.set(formattedDate, day);
      });
      
      // Log the dates we're checking against
      console.log("[useWeekViewData] Days in week view:", Array.from(formattedDayMap.keys()));
      
      // Process each appointment using UTC timestamps
      const blocks: AppointmentBlock[] = appointments.map(appointment => {
          // Skip invalid data
          if (!appointment.start_at || !appointment.end_at) {
            console.error("[useWeekViewData] Invalid appointment data, missing UTC timestamps:", appointment);
            return null;
          }
          
          // Get the local date from UTC timestamp
          const startDateTime = TimeZoneService.fromUTC(appointment.start_at, userTimeZone);
          const endDateTime = TimeZoneService.fromUTC(appointment.end_at, userTimeZone);
          
          // Extract just the date part for matching with week days
          const formattedDate = TimeZoneService.formatDate(startDateTime);
          
          console.log(`[useWeekViewData] Checking appointment ${appointment.id} with date ${formattedDate}`);
          
          // Check if this date is in our week view
          if (!formattedDayMap.has(formattedDate)) {
            console.log(`[useWeekViewData] Appointment ${appointment.id} date ${formattedDate} not in current week`);
            return null;
          }
          
          // Get the DateTime object for this day
          const dayDateTime = formattedDayMap.get(formattedDate)!;
          
          return {
            id: appointment.id,
            day: dayDateTime,
            start: startDateTime,
            end: endDateTime,
            clientId: appointment.client_id,
            type: appointment.type,
            clientName: getClientName(appointment.client_id)
          };
        }).filter(block => block !== null) as AppointmentBlock[];

      console.log(`[useWeekViewData] Created ${blocks.length} appointment blocks`);
      
      // Log sample processed block
      if (blocks.length > 0) {
        console.log(`[useWeekViewData] Sample processed appointment block:`, {
          id: blocks[0].id,
          day: TimeZoneService.formatDate(blocks[0].day),
          start: TimeZoneService.formatTime24(blocks[0].start),
          end: TimeZoneService.formatTime24(blocks[0].end)
        });
      }
      
      setAppointmentBlocks(blocks);
    } catch (error) {
      console.error("[useWeekViewData] Error in appointment processing:", error);
      setAppointmentBlocks([]);
    }
  }, [appointments, getClientName, daysAsDateTime, userTimeZone]);

  // Fetch availability from clinicians table
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        if (!clinicianId) {
          console.log("[useWeekViewData] No clinicianId provided, skipping availability fetch");
          setAvailabilityBlocks([]);
          setExceptions([]);
          processAvailabilityFromClinician([], []);
          setLoading(false);
          return;
        }

        // Format the clinicianId correctly
        const formattedClinicianId = clinicianId.trim();
        console.log(`[useWeekViewData] Fetching availability for clinician: ${formattedClinicianId}`);

        // Fetch clinician data with availability fields
        const { data: clinicianData, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', formattedClinicianId)
          .single();

        if (error) {
          console.error('[useWeekViewData] Error fetching clinician data:', error);
          setAvailabilityBlocks([]);
          setExceptions([]);
          processAvailabilityFromClinician([], []);
        } else {
          console.log('[useWeekViewData] Clinician data for availability:', clinicianData?.id);
          
          // Extract availability blocks from clinician data
          const extractedBlocks = extractAvailabilityBlocksFromClinician(clinicianData);
          setAvailabilityBlocks(extractedBlocks);
          
          // No exceptions to process for now
          setExceptions([]);
          processAvailabilityFromClinician(extractedBlocks, []);
        }
      } catch (error) {
        console.error('[useWeekViewData] Error fetching availability:', error);
        setAvailabilityBlocks([]);
        setExceptions([]);
        processAvailabilityFromClinician([], []);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger, daysAsDateTime]);

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
        const timezoneKey = `clinician_availability_timezone_${day}_${slot}`;
        
        // If both start and end times exist for this slot, create a block
        if (clinician[startTimeKey] && clinician[endTimeKey]) {
          blocks.push({
            id: `${clinician.id}-${day}-${slot}`,
            day_of_week: dayCapitalized,
            start_time: clinician[startTimeKey],
            end_time: clinician[endTimeKey],
            clinician_id: clinician.id,
            is_active: true,
          });
        }
      }
    });
    
    console.log('[useWeekViewData] Extracted availability blocks from clinician:', blocks.length);
    return blocks;
  };

  // Process availability data
  const processAvailabilityFromClinician = (blocks: AvailabilityBlock[], exceptionsData: AvailabilityException[]) => {
    const allTimeBlocks: TimeBlock[] = [];

    daysAsDateTime.forEach(day => {
      const dayOfWeek = day.toFormat('EEEE');
      
      // Filter blocks for this day of week
      const dayBlocks = blocks.filter(block => block.day_of_week === dayOfWeek);

      const parsedBlocks = dayBlocks.map(block => {
        // Create DateTime objects for start and end times
        const startTime = TimeZoneService.createDateTime(
          TimeZoneService.formatDate(day),
          block.start_time,
          userTimeZone
        );
        
        const endTime = TimeZoneService.createDateTime(
          TimeZoneService.formatDate(day),
          block.end_time,
          userTimeZone
        );

        return {
          id: block.id,
          day,
          start: startTime,
          end: endTime,
          isException: false,
          isStandalone: false
        };
      });

      // Sort blocks by start time
      parsedBlocks.sort((a, b) => a.start.toMillis() - b.start.toMillis());

      const mergedBlocks: TimeBlock[] = [];

      parsedBlocks.forEach(block => {
        const lastBlock = mergedBlocks[mergedBlocks.length - 1];

        if (lastBlock && block.start <= lastBlock.end) {
          if (block.end > lastBlock.end) {
            lastBlock.end = block.end;
          }
          lastBlock.availabilityIds.push(block.id);
        } else {
          mergedBlocks.push({
            day: block.day,
            start: block.start,
            end: block.end,
            availabilityIds: [block.id],
            isException: block.isException,
            isStandalone: block.isStandalone
          });
        }
      });

      allTimeBlocks.push(...mergedBlocks);
    });

    setTimeBlocks(allTimeBlocks);
  };

  const getAvailabilityForBlock = (blockId: string): AvailabilityBlock | undefined => {
    return availabilityBlocks.find(block => block.id === blockId);
  };

  const isTimeSlotAvailable = (date: Date, time: Date): boolean => {
    const dateTime = DateTime.fromJSDate(date)
      .set({
        hour: time.getHours(),
        minute: time.getMinutes(),
        second: 0,
        millisecond: 0
      })
      .setZone(userTimeZone);

    return timeBlocks.some(block => {
      return block.start <= dateTime && dateTime < block.end;
    });
  };

  const getBlockForTimeSlot = (date: Date, time: Date): TimeBlock | undefined => {
    const dateTime = DateTime.fromJSDate(date)
      .set({
        hour: time.getHours(),
        minute: time.getMinutes(),
        second: 0,
        millisecond: 0
      })
      .setZone(userTimeZone);

    return timeBlocks.find(block => {
      return block.start <= dateTime && dateTime < block.end;
    });
  };

  const getAppointmentForTimeSlot = (date: Date, time: Date): AppointmentBlock | undefined => {
    const dateTime = DateTime.fromJSDate(date)
      .set({
        hour: time.getHours(),
        minute: time.getMinutes(),
        second: 0,
        millisecond: 0
      })
      .setZone(userTimeZone);

    return appointmentBlocks.find(block => {
      return block.start <= dateTime && dateTime < block.end;
    });
  };

  return {
    loading,
    timeBlocks,
    exceptions,
    availabilityBlocks,
    appointmentBlocks,
    getAvailabilityForBlock,
    isTimeSlotAvailable,
    getBlockForTimeSlot,
    getAppointmentForTimeSlot
  };
};
