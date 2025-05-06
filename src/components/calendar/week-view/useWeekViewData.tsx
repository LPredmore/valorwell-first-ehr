
import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfDay,
  isSameDay,
  setHours,
  setMinutes,
  parseISO
} from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
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
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
}

interface AppointmentBlock {
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

  // Process appointments into blocks
  useEffect(() => {
    if (!appointments || !appointments.length) {
      setAppointmentBlocks([]);
      console.log("[useWeekViewData] No appointments to process");
      return;
    }

    console.log(`[useWeekViewData] Processing ${appointments.length} appointments with timezone: ${userTimeZone}`);
    
    try {
      const blocks: AppointmentBlock[] = appointments.map(appointment => {
        if (!appointment.date || !appointment.start_time || !appointment.end_time) {
          console.error("[useWeekViewData] Invalid appointment data:", appointment);
          return null;
        }
        
        let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0;

        // Handle timezone conversion for appointments
        try {
          // Convert the appointment times from UTC to user timezone
          const localizedAppointment = TimeZoneService.convertEventToUserTimeZone(
            appointment, 
            userTimeZone
          );
          
          if (!localizedAppointment.start_time || !localizedAppointment.end_time) {
            throw new Error("Missing time information in localized appointment");
          }
          
          [startHour, startMinute] = localizedAppointment.start_time.split(':').map(Number);
          [endHour, endMinute] = localizedAppointment.end_time.split(':').map(Number);
          
          console.log(`[useWeekViewData] Appointment ${appointment.id} time converted:`, {
            original: { start: appointment.start_time, end: appointment.end_time },
            localized: { start: localizedAppointment.start_time, end: localizedAppointment.end_time }
          });
        } catch (error) {
          console.error("[useWeekViewData] Error converting appointment times:", error);
          // Fallback to original time if conversion fails
          [startHour, startMinute] = appointment.start_time.split(':').map(Number);
          [endHour, endMinute] = appointment.end_time.split(':').map(Number);
        }

        try {
          const dateObj = parseISO(appointment.date);
          const start = setMinutes(setHours(startOfDay(dateObj), startHour), startMinute);
          const end = setMinutes(setHours(startOfDay(dateObj), endHour), endMinute);

          console.log(`[useWeekViewData] Created appointment block for date ${format(dateObj, 'yyyy-MM-dd')}:`, {
            start: format(start, 'HH:mm'),
            end: format(end, 'HH:mm')
          });
          
          return {
            id: appointment.id,
            day: dateObj,
            start,
            end,
            clientId: appointment.client_id,
            type: appointment.type,
            clientName: getClientName(appointment.client_id)
          };
        } catch (error) {
          console.error(`[useWeekViewData] Error processing appointment ${appointment.id}:`, error);
          return null;
        }
      }).filter(block => block !== null) as AppointmentBlock[];

      console.log(`[useWeekViewData] Created ${blocks.length} appointment blocks`);
      setAppointmentBlocks(blocks);
    } catch (error) {
      console.error("[useWeekViewData] Error in appointment processing:", error);
      setAppointmentBlocks([]);
    }
  }, [appointments, getClientName, userTimeZone]);

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
  }, [clinicianId, refreshTrigger, days]);

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

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      
      // Filter blocks for this day of week
      const dayBlocks = blocks.filter(block => block.day_of_week === dayOfWeek);

      const parsedBlocks = dayBlocks.map(block => {
        // Extract hours and minutes
        const [startHour, startMinute] = block.start_time.split(':').map(Number);
        const [endHour, endMinute] = block.end_time.split(':').map(Number);

        const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
        const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);

        return {
          id: block.id,
          day,
          start,
          end,
          isException: false,
          isStandalone: false
        };
      });

      parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

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
      const slotTime = setMinutes(
        setHours(startOfDay(day), timeSlot.getHours()),
        timeSlot.getMinutes()
      );
  
      return timeBlocks.some(block =>
        isSameDay(block.day, day) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
      const slotTime = setMinutes(
        setHours(startOfDay(day), timeSlot.getHours()),
        timeSlot.getMinutes()
      );
  
      return timeBlocks.find(block =>
        isSameDay(block.day, day) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
      // Format for easier debugging
      const dayFormatted = format(day, 'yyyy-MM-dd');
      
      // Get the time components only from the time slot
      const slotHours = timeSlot.getHours();
      const slotMinutes = timeSlot.getMinutes();
      
      // Find appointments on the same day where the time slot falls within the appointment time
      const appointment = appointmentBlocks.find(block => {
        // First check if we're on the same day
        const sameDayCheck = isSameDay(block.day, day);
        if (!sameDayCheck) return false;
        
        // Get the time components from the appointment
        const apptStartHours = block.start.getHours();
        const apptStartMinutes = block.start.getMinutes();
        const apptEndHours = block.end.getHours();
        const apptEndMinutes = block.end.getMinutes();
        
        // Convert to minutes for easier comparison
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const apptStartTotalMinutes = apptStartHours * 60 + apptStartMinutes;
        const apptEndTotalMinutes = apptEndHours * 60 + apptEndMinutes;
        
        // Check if the slot time falls within the appointment time
        const isWithinAppointment = 
          slotTotalMinutes >= apptStartTotalMinutes && 
          slotTotalMinutes < apptEndTotalMinutes;
        
        if (isWithinAppointment) {
          console.log(`[useWeekViewData] Found appointment ${block.id} for ${dayFormatted} at ${format(timeSlot, 'HH:mm')}:`, {
            appointmentDay: format(block.day, 'yyyy-MM-dd'),
            appointmentTime: `${format(block.start, 'HH:mm')} - ${format(block.end, 'HH:mm')}`,
            slotTime: format(timeSlot, 'HH:mm')
          });
        }
        
        return isWithinAppointment;
      });
      
      return appointment;
    };

    return {
      isTimeSlotAvailable,
      getBlockForTimeSlot,
      getAppointmentForTimeSlot
    };
  }, [timeBlocks, appointmentBlocks]);

  // Helper to get availability block by ID
  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find(block => block.id === blockId);
  };

  return {
    loading,
    timeBlocks,
    appointmentBlocks,
    exceptions,
    availabilityBlocks,
    getAvailabilityForBlock,
    ...timeSlotUtils
  };
};

export type { Appointment, AvailabilityBlock, AvailabilityException, TimeBlock, AppointmentBlock };
