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

  // Simplified appointment processing with improved logging
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
      
      // Process each appointment with simplified matching
      const blocks: AppointmentBlock[] = appointments.map(appointment => {
          // Skip invalid data
          if (!appointment.date || !appointment.start_time || !appointment.end_time) {
            console.error("[useWeekViewData] Invalid appointment data:", appointment);
            return null;
          }
          
          // Simplify date matching by normalizing to YYYY-MM-DD
          let normalizedDate = appointment.date;
          if (normalizedDate.includes('T')) {
            normalizedDate = normalizedDate.split('T')[0];
          }
          
          console.log(`[useWeekViewData] Checking appointment ${appointment.id} with date ${normalizedDate}`);
          
          // Check if this date is in our week view
          if (!formattedDayMap.has(normalizedDate)) {
            console.log(`[useWeekViewData] Appointment ${appointment.id} date ${normalizedDate} not in current week`);
            return null;
          }
          
          // Get the DateTime object for this day
          const dayDateTime = formattedDayMap.get(normalizedDate)!;
          
          // Create start and end DateTimes by combining the day with the time strings
          let startDateTime: DateTime;
          let endDateTime: DateTime;
          
          try {
            // Create DateTime objects for the appointment times
            startDateTime = TimeZoneService.createDateTime(
              normalizedDate,
              appointment.start_time,
              userTimeZone
            );
            
            endDateTime = TimeZoneService.createDateTime(
              normalizedDate,
              appointment.end_time,
              userTimeZone
            );
            
            console.log(`[useWeekViewData] Successfully created time blocks for appointment ${appointment.id}:`, {
              date: normalizedDate,
              start: appointment.start_time,
              startFormatted: TimeZoneService.formatTime24(startDateTime),
              end: appointment.end_time,
              endFormatted: TimeZoneService.formatTime24(endDateTime),
            });
            
            return {
              id: appointment.id,
              day: dayDateTime,
              start: startDateTime,
              end: endDateTime,
              clientId: appointment.client_id,
              type: appointment.type,
              clientName: getClientName(appointment.client_id)
            };
          } catch (error) {
            console.error(`[useWeekViewData] Error processing appointment ${appointment.id} times:`, error);
            return null;
          }
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

    console.log('[useWeekViewData] Processed time blocks from clinician data:', allTimeBlocks.length);
    setTimeBlocks(allTimeBlocks);
  };

  // Utility functions for time slot checking
  const timeSlotUtils = useMemo(() => {
    const isTimeSlotAvailable = (day: Date, timeSlot: Date) => {
      // Convert JS Dates to DateTime objects
      const dayDt = TimeZoneService.fromJSDate(day, userTimeZone);
      const timeSlotDt = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      
      // Create a DateTime that combines the day with the time
      const slotTime = dayDt.set({
        hour: timeSlotDt.hour,
        minute: timeSlotDt.minute
      });
  
      return timeBlocks.some(block =>
        TimeZoneService.isSameDay(block.day, dayDt) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
      // Convert JS Dates to DateTime objects
      const dayDt = TimeZoneService.fromJSDate(day, userTimeZone);
      const timeSlotDt = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      
      // Create a DateTime that combines the day with the time
      const slotTime = dayDt.set({
        hour: timeSlotDt.hour,
        minute: timeSlotDt.minute
      });
  
      const block = timeBlocks.find(block =>
        TimeZoneService.isSameDay(block.day, dayDt) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
      
      if (!block) return null;
      
      // Convert to JS Date compatible format for external use
      return {
        day: block.day.toJSDate(),
        start: block.start.toJSDate(),
        end: block.end.toJSDate(),
        availabilityIds: block.availabilityIds,
        isException: block.isException,
        isStandalone: block.isStandalone
      } as JSTimeBlock;
    };
  
    const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
      // Convert JS Dates to DateTime objects
      const dayDt = TimeZoneService.fromJSDate(day, userTimeZone);
      const timeSlotDt = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      
      // Format for easier debugging
      const dayFormatted = TimeZoneService.formatDate(dayDt);
      
      // Create a DateTime that combines the day with the time
      const slotTime = dayDt.set({
        hour: timeSlotDt.hour,
        minute: timeSlotDt.minute
      });
      
      console.log(`[useWeekViewData] Looking for appointments on ${dayFormatted} at ${TimeZoneService.formatTime24(slotTime)}`);
      console.log(`[useWeekViewData] Total appointment blocks: ${appointmentBlocks.length}`);
      
      // Find appointments on the same day where the time slot falls within the appointment time
      const appointment = appointmentBlocks.find(block => {
        // First check if we're on the same day using isSameDay for more reliable comparison
        const sameDayCheck = TimeZoneService.isSameDay(block.day, dayDt);
        
        // Log the day comparison for debugging
        console.log(`[useWeekViewData] Day comparison for appointment ${block.id}:`, {
          appointmentDay: TimeZoneService.formatDate(block.day),
          slotDay: dayFormatted,
          sameDayCheck
        });
        
        if (!sameDayCheck) return false;
        
        // Convert to minutes for easier comparison
        const slotTotalMinutes = slotTime.hour * 60 + slotTime.minute;
        const apptStartTotalMinutes = block.start.hour * 60 + block.start.minute;
        const apptEndTotalMinutes = block.end.hour * 60 + block.end.minute;
        
        // Check if the slot time falls within the appointment time
        const isWithinAppointment =
          slotTotalMinutes >= apptStartTotalMinutes &&
          slotTotalMinutes < apptEndTotalMinutes;
        
        // Log the time comparison for debugging
        console.log(`[useWeekViewData] Time comparison for appointment ${block.id}:`, {
          slotTime: `${slotTime.hour}:${slotTime.minute} (${slotTotalMinutes} mins)`,
          appointmentStart: `${block.start.hour}:${block.start.minute} (${apptStartTotalMinutes} mins)`,
          appointmentEnd: `${block.end.hour}:${block.end.minute} (${apptEndTotalMinutes} mins)`,
          isWithinAppointment
        });
        
        if (isWithinAppointment) {
          console.log(`[useWeekViewData] Found appointment ${block.id} for ${dayFormatted} at ${TimeZoneService.formatTime24(slotTime)}:`, {
            appointmentDay: TimeZoneService.formatDate(block.day),
            appointmentTime: `${TimeZoneService.formatTime24(block.start)} - ${TimeZoneService.formatTime24(block.end)}`,
            slotTime: TimeZoneService.formatTime24(slotTime)
          });
        }
        
        return isWithinAppointment;
      });
      
      if (!appointment) return null;
      
      // Convert to JS Date compatible format for external use
      return {
        id: appointment.id,
        day: appointment.day.toJSDate(),
        start: appointment.start.toJSDate(),
        end: appointment.end.toJSDate(),
        clientId: appointment.clientId,
        type: appointment.type,
        clientName: appointment.clientName
      } as JSAppointmentBlock;
    };

    return {
      isTimeSlotAvailable,
      getBlockForTimeSlot,
      getAppointmentForTimeSlot
    };
  }, [timeBlocks, appointmentBlocks, userTimeZone]);

  // Helper to get availability block by ID
  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find(block => block.id === blockId);
  };

  // Convert DateTime objects to JS Dates for external use
  const jsTimeBlocks = useMemo(() => {
    return timeBlocks.map(block => ({
      day: block.day.toJSDate(),
      start: block.start.toJSDate(),
      end: block.end.toJSDate(),
      availabilityIds: block.availabilityIds,
      isException: block.isException,
      isStandalone: block.isStandalone
    })) as JSTimeBlock[];
  }, [timeBlocks]);

  const jsAppointmentBlocks = useMemo(() => {
    return appointmentBlocks.map(block => ({
      id: block.id,
      day: block.day.toJSDate(),
      start: block.start.toJSDate(),
      end: block.end.toJSDate(),
      clientId: block.clientId,
      type: block.type,
      clientName: block.clientName
    })) as JSAppointmentBlock[];
  }, [appointmentBlocks]);

  return {
    loading,
    timeBlocks: jsTimeBlocks,
    appointmentBlocks: jsAppointmentBlocks,
    exceptions,
    availabilityBlocks,
    getAvailabilityForBlock,
    ...timeSlotUtils
  };
};

export type { Appointment, AvailabilityBlock, AvailabilityException, JSTimeBlock as TimeBlock, JSAppointmentBlock as AppointmentBlock };
