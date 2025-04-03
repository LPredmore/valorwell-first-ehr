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
  getClientName: (clientId: string) => string = () => 'Client'
) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);

  // Process appointments into blocks
  useEffect(() => {
    if (!appointments.length) {
      setAppointmentBlocks([]);
      console.log("No appointments to process in week view");
      return;
    }

    console.log("Processing appointments in week view:", appointments);
    
    const blocks: AppointmentBlock[] = appointments.map(appointment => {
      const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
      const [endHour, endMinute] = appointment.end_time.split(':').map(Number);

      const dateObj = parseISO(appointment.date);
      const start = setMinutes(setHours(startOfDay(dateObj), startHour), startMinute);
      const end = setMinutes(setHours(startOfDay(dateObj), endHour), endMinute);

      const result = {
        id: appointment.id,
        day: dateObj,
        start,
        end,
        clientId: appointment.client_id,
        type: appointment.type,
        clientName: getClientName(appointment.client_id)
      };
      
      console.log(`Week view processed appointment ${appointment.id}:`, {
        date: format(dateObj, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        rawStart: appointment.start_time,
        rawEnd: appointment.end_time
      });
      
      return result;
    });

    console.log("Week view appointment blocks created:", blocks);
    setAppointmentBlocks(blocks);
  }, [appointments, getClientName]);

  // Fetch availability and exceptions
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Create string versions of the dates for the query
        const startDateStr = format(days[0], 'yyyy-MM-dd');
        const endDateStr = format(days[days.length - 1], 'yyyy-MM-dd');
        
        console.log(`Fetching availability for date range: ${startDateStr} to ${endDateStr}`);
        
        // Fetch regular availability
        let query = supabase
          .from('availability')
          .select('*')
          .eq('is_active', true);

        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }

        const { data: availabilityData, error } = await query;

        if (error) {
          console.error('Error fetching availability:', error);
          setAvailabilityBlocks([]);
          setExceptions([]);
          processAvailabilityWithExceptions([], []);
          return;
        }
        
        console.log('WeekView regular availability data:', availabilityData);
        setAvailabilityBlocks(availabilityData || []);
        
        // No point continuing if no clinicianId
        if (!clinicianId) {
          setExceptions([]);
          processAvailabilityWithExceptions(availabilityData || [], []);
          return;
        }
        
        // Fetch exceptions - we need these regardless of whether there's regular availability
        const { data: exceptionsData, error: exceptionsError } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('specific_date', startDateStr)
          .lte('specific_date', endDateStr);
        
        if (exceptionsError) {
          console.error('Error fetching exceptions:', exceptionsError);
          setExceptions([]);
          processAvailabilityWithExceptions(availabilityData || [], []);
          return;
        }
        
        console.log('WeekView exceptions data:', exceptionsData);
        setExceptions(exceptionsData || []);
        
        // Process the data
        processAvailabilityWithExceptions(availabilityData || [], exceptionsData || []);
      } catch (error) {
        console.error('Error in fetchAvailability:', error);
        setAvailabilityBlocks([]);
        setExceptions([]);
        processAvailabilityWithExceptions([], []);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger, days]);

  // Process availability data with exceptions
  const processAvailabilityWithExceptions = (blocks: AvailabilityBlock[], exceptionsData: AvailabilityException[]) => {
    console.log('Processing availability with exceptions:', { 
      blocks: blocks.length, 
      exceptions: exceptionsData.length 
    });
    
    const allTimeBlocks: TimeBlock[] = [];

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Get all exceptions for this day
      const exceptionsForDay = exceptionsData.filter(exc => exc.specific_date === dateStr);
      console.log(`Exceptions for ${dateStr} (${dayOfWeek}):`, exceptionsForDay);
      
      // Get the IDs of regular blocks that are deleted by exceptions
      const deletedRegularBlockIds = exceptionsForDay
        .filter(exc => exc.is_deleted && exc.original_availability_id)
        .map(exc => exc.original_availability_id);
      
      console.log(`Deleted regular block IDs for ${dateStr}:`, deletedRegularBlockIds);
      
      // Process regular blocks (excluding those with deletion exceptions)
      const regularBlocks = blocks
        .filter(block => block.day_of_week === dayOfWeek)
        .filter(block => !deletedRegularBlockIds.includes(block.id))
        .map(block => {
          // Check if this regular block is modified by an exception
          const modifyingException = exceptionsForDay.find(
            exc => exc.original_availability_id === block.id && 
                  !exc.is_deleted && 
                  exc.start_time && 
                  exc.end_time
          );
          
          if (modifyingException) {
            console.log(`Block ${block.id} is modified by exception ${modifyingException.id}`);
            return {
              ...block,
              id: modifyingException.id, // Use the exception ID for modified blocks
              start_time: modifyingException.start_time,
              end_time: modifyingException.end_time,
              isException: true
            };
          }
          
          return block;
        });
      
      // Process standalone exceptions (not linked to any regular block)
      const standaloneExceptions = exceptionsForDay
        .filter(exception => 
          exception.original_availability_id === null && 
          !exception.is_deleted && 
          exception.start_time && 
          exception.end_time
        );
      
      console.log(`Standalone exceptions for ${dateStr}:`, standaloneExceptions);
      
      const standaloneBlocks = standaloneExceptions.map(exception => ({
        id: exception.id,
        day_of_week: dayOfWeek,
        start_time: exception.start_time!,
        end_time: exception.end_time!,
        clinician_id: exception.clinician_id,
        is_active: true,
        isException: true,
        isStandalone: true
      }));
      
      // Combine regular and standalone blocks
      const allDayBlocks = [...regularBlocks, ...standaloneBlocks];
      console.log(`All blocks for ${dateStr} after processing:`, allDayBlocks);
      
      // Convert string times to Date objects
      const parsedBlocks = allDayBlocks.map(block => {
        // Safe parsing with fallbacks for invalid time strings
        let startHour = 9, startMinute = 0, endHour = 17, endMinute = 0;
        
        if (typeof block.start_time === 'string' && block.start_time.includes(':')) {
          [startHour, startMinute] = block.start_time.split(':').map(Number);
        }
        
        if (typeof block.end_time === 'string' && block.end_time.includes(':')) {
          [endHour, endMinute] = block.end_time.split(':').map(Number);
        }

        const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
        const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);

        return {
          day,
          start,
          end,
          availabilityIds: [block.id],
          isException: block.isException,
          isStandalone: block.isStandalone
        };
      });

      // Sort blocks by start time
      parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      // Merge overlapping blocks
      const mergedBlocks: TimeBlock[] = [];
      parsedBlocks.forEach(block => {
        const lastBlock = mergedBlocks[mergedBlocks.length - 1];

        if (lastBlock && block.start <= lastBlock.end) {
          // Merge overlapping blocks
          if (block.end > lastBlock.end) {
            lastBlock.end = block.end;
          }
          // Add the block ID to the list
          lastBlock.availabilityIds.push(...block.availabilityIds);
          // If either block is an exception, the merged block is an exception
          if (block.isException) {
            lastBlock.isException = true;
          }
          // Same for standalone flag
          if (block.isStandalone) {
            lastBlock.isStandalone = true;
          }
        } else {
          // No overlap, add as new block
          mergedBlocks.push({
            day: block.day,
            start: block.start,
            end: block.end,
            availabilityIds: [...block.availabilityIds],
            isException: block.isException,
            isStandalone: block.isStandalone
          });
        }
      });

      allTimeBlocks.push(...mergedBlocks);
    });

    console.log('Final processed time blocks:', allTimeBlocks);
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
      // Log to debug appointment matching
      console.log(`Checking appointments for ${format(day, 'yyyy-MM-dd')} at ${format(timeSlot, 'HH:mm')}`);
      
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
          console.log(`Found appointment ${block.id} for ${format(day, 'yyyy-MM-dd')} at ${format(timeSlot, 'HH:mm')}:`, {
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
