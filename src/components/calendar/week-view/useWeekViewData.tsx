
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
  originalAvailabilityId?: string | null;
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
  // Add these properties to fix the TypeScript errors
  id: string;
  originalAvailabilityId?: string | null;
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

// Helper function to normalize day_of_week values that can be either numeric or named
const normalizeDayOfWeek = (day: string): string => {
  // Map of numeric values to day names
  const dayMap: { [key: string]: string } = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };

  // If the day is a number as a string, convert to day name
  return dayMap[day] || day;
};

// Function to get day of week as a string for a given date
const getDayOfWeekString = (date: Date): string => {
  return format(date, 'EEEE');
};

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
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      
      try {
        // Verify we have a clinician ID before proceeding
        if (!clinicianId) {
          console.log("[WeekView] No clinicianId provided, skipping availability fetch");
          setAvailabilityBlocks([]);
          setExceptions([]);
          processAvailabilityWithExceptions([], []);
          setLoading(false);
          return;
        }
        
        console.log(`[WeekView] Fetching availability for clinician: ${clinicianId}`);
        
        // Get current auth user for verification
        const { data: authData } = await supabase.auth.getUser();
        console.log(`[WeekView] Current user: ${authData?.user?.id || 'No user'}`);
        
        // Query availability with proper filtering
        const { data: availabilityData, error } = await supabase
          .from('availability')
          .select('*')
          .eq('is_active', true)
          .eq('clinician_id', clinicianId);

        if (error) {
          console.error('[WeekView] Error fetching availability:', error);
          setError(`Error fetching availability: ${error.message}`);
          setAvailabilityBlocks([]);
          setExceptions([]);
          processAvailabilityWithExceptions([], []);
        } else {
          console.log(`[WeekView] Retrieved ${availabilityData?.length || 0} availability records for clinician ${clinicianId}:`, availabilityData);
          setAvailabilityBlocks(availabilityData || []);
          
          const startDateStr = format(days[0], 'yyyy-MM-dd');
          const endDateStr = format(days[days.length - 1], 'yyyy-MM-dd');
          
          // Fetch exceptions for this clinician
          if (availabilityData && availabilityData.length > 0) {
            const availabilityIds = availabilityData.map(block => block.id);
            
            if (availabilityIds.length > 0) {
              console.log(`[WeekView] Fetching exceptions for clinician: ${clinicianId}, dates: ${startDateStr} to ${endDateStr}`);
              
              const { data: exceptionsData, error: exceptionsError } = await supabase
                .from('availability_exceptions')
                .select('*')
                .eq('clinician_id', clinicianId)
                .gte('specific_date', startDateStr)
                .lte('specific_date', endDateStr)
                .or(`original_availability_id.in.(${availabilityIds.join(',')}),original_availability_id.is.null`);
                
              if (exceptionsError) {
                console.error('[WeekView] Error fetching exceptions:', exceptionsError);
                setError(`Error fetching exceptions: ${exceptionsError.message}`);
                setExceptions([]);
                processAvailabilityWithExceptions(availabilityData || [], []);
              } else {
                console.log(`[WeekView] Retrieved ${exceptionsData?.length || 0} exceptions:`, exceptionsData);
                setExceptions(exceptionsData || []);
                processAvailabilityWithExceptions(availabilityData || [], exceptionsData || []);
              }
            } else {
              fetchStandaloneExceptions(startDateStr, endDateStr, clinicianId, availabilityData);
            }
          } else {
            fetchStandaloneExceptions(startDateStr, endDateStr, clinicianId, []);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[WeekView] Exception in availability fetching:', error);
        setError(`Unexpected error: ${errorMessage}`);
        setAvailabilityBlocks([]);
        setExceptions([]);
        processAvailabilityWithExceptions([], []);
      } finally {
        setLoading(false);
      }
    };

    const fetchStandaloneExceptions = async (startDateStr: string, endDateStr: string, clinicianId: string, availabilityData: AvailabilityBlock[]) => {
      try {
        console.log(`[WeekView] Fetching standalone exceptions for clinician: ${clinicianId}`);
        
        const { data: exceptionsData, error: exceptionsError } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_deleted', false)
          .is('original_availability_id', null)
          .gte('specific_date', startDateStr)
          .lte('specific_date', endDateStr);
          
        if (exceptionsError) {
          console.error('[WeekView] Error fetching standalone exceptions:', exceptionsError);
          setError(`Error fetching standalone exceptions: ${exceptionsError.message}`);
          setExceptions([]);
          processAvailabilityWithExceptions(availabilityData || [], []);
        } else {
          console.log(`[WeekView] Retrieved ${exceptionsData?.length || 0} standalone exceptions:`, exceptionsData);
          setExceptions(exceptionsData || []);
          processAvailabilityWithExceptions(availabilityData || [], exceptionsData || []);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[WeekView] Exception in standalone exceptions fetching:', error);
        setError(`Unexpected error: ${errorMessage}`);
        processAvailabilityWithExceptions(availabilityData || [], []);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger, days]);

  // Process availability data with exceptions
  const processAvailabilityWithExceptions = (blocks: AvailabilityBlock[], exceptionsData: AvailabilityException[]) => {
    const allTimeBlocks: TimeBlock[] = [];

    days.forEach(day => {
      const dayOfWeek = getDayOfWeekString(day);
      const dateStr = format(day, 'yyyy-MM-dd');
      const exceptionsForDay = exceptionsData.filter(exc => exc.specific_date === dateStr);
      
      // First identify which regular blocks are deleted
      const deletedAvailabilityIds = new Set(
        exceptionsForDay
          .filter(exc => exc.is_deleted && exc.original_availability_id)
          .map(exc => exc.original_availability_id)
      );
      
      // Regular availability blocks that haven't been deleted
      // Handle both named and numeric day_of_week values
      const dayBlocks = blocks
        .filter(block => {
          const normalizedBlockDay = normalizeDayOfWeek(block.day_of_week);
          return normalizedBlockDay === dayOfWeek;
        })
        .filter(block => !deletedAvailabilityIds.has(block.id))
        .map(block => {
          // Find if this block has a time-modification exception
          const exception = exceptionsForDay.find(e => 
            e.original_availability_id === block.id && !e.is_deleted
          );
          
          // If there's a time-modification exception, apply it
          if (exception && exception.start_time && exception.end_time) {
            console.log(`Found time modification for block ${block.id}:`, {
              exceptionId: exception.id,
              originalStartTime: block.start_time,
              originalEndTime: block.end_time,
              newStartTime: exception.start_time,
              newEndTime: exception.end_time,
              clinicianId: block.clinician_id
            });
            
            return {
              ...block,
              start_time: exception.start_time,
              end_time: exception.end_time,
              isException: true,
              // Store the original availability ID for accurate database operations
              originalAvailabilityId: block.id
            };
          }
          
          return block;
        });

      // Get standalone exceptions (original_availability_id is null and not deleted)
      const standaloneExceptions = exceptionsForDay
        .filter(exception => 
          exception.original_availability_id === null && 
          !exception.is_deleted && 
          exception.start_time && 
          exception.end_time
        );
      
      console.log(`Found ${standaloneExceptions.length} standalone exceptions for ${dateStr}`);
      
      // Convert standalone exceptions to blocks
      const standaloneBlocks = standaloneExceptions.map(exception => ({
        id: exception.id,
        day_of_week: dayOfWeek,
        start_time: exception.start_time || '09:00',
        end_time: exception.end_time || '17:00',
        clinician_id: exception.clinician_id,
        is_active: true,
        isException: true,
        isStandalone: true,
        originalAvailabilityId: null
      }));
      
      // Combine regular blocks and standalone blocks
      const allDayBlocks = [...dayBlocks, ...standaloneBlocks];
      
      console.log(`Processing ${allDayBlocks.length} total blocks for ${dateStr}:`, 
        allDayBlocks.map(b => ({
          id: b.id, 
          isException: b.isException, 
          isStandalone: b.isStandalone,
          originalAvailabilityId: b.originalAvailabilityId,
          clinicianId: b.clinician_id
        }))
      );

      // Convert to TimeBlock objects
      const parsedBlocks = allDayBlocks.map(block => {
        const [startHour, startMinute] = block.start_time.split(':').map(Number);
        const [endHour, endMinute] = block.end_time.split(':').map(Number);

        const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
        const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);

        return {
          id: block.id,
          day,
          start,
          end,
          availabilityIds: [block.id],
          isException: block.isException,
          isStandalone: block.isStandalone,
          originalAvailabilityId: block.originalAvailabilityId
        };
      });

      // Sort blocks by start time
      parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Merge adjacent blocks for display
      const mergedBlocks: TimeBlock[] = [];

      parsedBlocks.forEach(block => {
        const lastBlock = mergedBlocks[mergedBlocks.length - 1];

        if (lastBlock && block.start <= lastBlock.end) {
          // Extend the last block if needed
          if (block.end > lastBlock.end) {
            lastBlock.end = block.end;
          }
          
          // Add this block's ID to the merged block
          lastBlock.availabilityIds.push(block.id);
          
          // Keep track of block properties
          if (block.isException) {
            lastBlock.isException = true;
          }
          
          if (block.isStandalone) {
            lastBlock.isStandalone = true;
          }
          
          // Preserve the original ID for database operations
          if (!lastBlock.originalAvailabilityId && block.originalAvailabilityId) {
            lastBlock.originalAvailabilityId = block.originalAvailabilityId;
          }
        } else {
          // Create a new block if not adjacent
          mergedBlocks.push({
            day: block.day,
            start: block.start,
            end: block.end,
            availabilityIds: [block.id],
            isException: block.isException,
            isStandalone: block.isStandalone,
            id: block.id,
            originalAvailabilityId: block.originalAvailabilityId
          });
        }
      });

      // Add the merged blocks for this day to the overall collection
      allTimeBlocks.push(...mergedBlocks);
    });

    console.log('Final timeBlocks after merging:', 
      allTimeBlocks.map(b => ({
        day: format(b.day, 'yyyy-MM-dd'),
        start: format(b.start, 'HH:mm'),
        end: format(b.end, 'HH:mm'),
        id: b.id,
        isException: b.isException,
        isStandalone: b.isStandalone,
        originalAvailabilityId: b.originalAvailabilityId,
        availabilityIds: b.availabilityIds
      }))
    );
    
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
      console.log(`Checking appointments for ${format(day, 'yyyy-MM-dd')} at ${format(timeSlot, 'HH:mm')}`);
      
      const slotHours = timeSlot.getHours();
      const slotMinutes = timeSlot.getMinutes();
      
      const appointment = appointmentBlocks.find(block => {
        const sameDayCheck = isSameDay(block.day, day);
        if (!sameDayCheck) return false;
        
        const apptStartHours = block.start.getHours();
        const apptStartMinutes = block.start.getMinutes();
        const apptEndHours = block.end.getHours();
        const apptEndMinutes = block.end.getMinutes();
        
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const apptStartTotalMinutes = apptStartHours * 60 + apptStartMinutes;
        const apptEndTotalMinutes = apptEndHours * 60 + apptEndMinutes;
        
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
    error,
    timeBlocks,
    appointmentBlocks,
    exceptions,
    availabilityBlocks,
    getAvailabilityForBlock,
    ...timeSlotUtils
  };
};

export type { Appointment, AvailabilityBlock, AvailabilityException, TimeBlock, AppointmentBlock };
