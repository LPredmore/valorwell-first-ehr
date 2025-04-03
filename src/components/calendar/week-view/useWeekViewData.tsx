
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
  id: string;
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
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

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        console.log('Fetching availability data for days:', days.map(day => format(day, 'yyyy-MM-dd')));
        
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
        } else {
          console.log('WeekView availability data:', availabilityData);
          setAvailabilityBlocks(availabilityData || []);
          
          // Fetch exceptions for the week range
          if (clinicianId && days.length > 0) {
            const startDateStr = format(days[0], 'yyyy-MM-dd');
            const endDateStr = format(days[days.length - 1], 'yyyy-MM-dd');
            
            console.log('Fetching exceptions for date range:', startDateStr, 'to', endDateStr);
            
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
            } else {
              console.log('WeekView exceptions data:', exceptionsData);
              setExceptions(exceptionsData || []);
              processAvailabilityWithExceptions(availabilityData || [], exceptionsData || []);
            }
          } else {
            setExceptions([]);
            processAvailabilityWithExceptions(availabilityData || [], []);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setAvailabilityBlocks([]);
        setExceptions([]);
        processAvailabilityWithExceptions([], []);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger, days]);

  const processAvailabilityWithExceptions = (blocks: AvailabilityBlock[], exceptionsData: AvailabilityException[]) => {
    const allTimeBlocks: TimeBlock[] = [];

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      const exceptionsForDay = exceptionsData.filter(exc => exc.specific_date === dateStr);
      
      // Track which recurring blocks should be excluded due to exceptions
      const excludedRecurringIds = new Set<string>();
      
      // First, process exceptions to identify which recurring blocks should be excluded
      exceptionsForDay.forEach(exception => {
        if (exception.original_availability_id) {
          // If this is an exception to a recurring availability, mark the original for exclusion
          excludedRecurringIds.add(exception.original_availability_id);
        }
      });
      
      console.log(`Excluded recurring IDs for ${dateStr}:`, Array.from(excludedRecurringIds));
      
      // Get recurring availability blocks for this day of week, EXCLUDING those with exceptions
      const dayBlocks = blocks
        .filter(block => block.day_of_week === dayOfWeek)
        .filter(block => {
          // Filter out any blocks that:
          // 1. Have a deletion exception for this date
          // 2. Have a modification exception for this date
          const shouldExclude = excludedRecurringIds.has(block.id);
          return !shouldExclude;
        });

      // Get one-time availability blocks and modification exceptions for this specific date
      const exceptionBlocks = exceptionsForDay
        .filter(exception => !exception.is_deleted && exception.start_time && exception.end_time)
        .map(exception => ({
          id: exception.id,
          day_of_week: dayOfWeek,
          start_time: exception.start_time,
          end_time: exception.end_time,
          clinician_id: exception.clinician_id,
          is_active: true,
          isException: !!exception.original_availability_id,
          isStandalone: !exception.original_availability_id,
          originalAvailabilityId: exception.original_availability_id
        }));
      
      console.log(`Exception blocks for ${dateStr}:`, exceptionBlocks);
      
      const allDayBlocks = [...dayBlocks, ...exceptionBlocks];
      console.log(`Combined blocks for ${dateStr}:`, allDayBlocks);

      const parsedBlocks = allDayBlocks.map(block => {
        const [startHour, startMinute] = (block.start_time as string).split(':').map(Number);
        const [endHour, endMinute] = (block.end_time as string).split(':').map(Number);

        const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
        const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);

        return {
          id: block.id,
          day,
          start,
          end,
          isException: !!block.isException,
          isStandalone: !!block.isStandalone,
          originalAvailabilityId: (block as any).originalAvailabilityId,
          availabilityIds: [block.id]
        };
      });

      parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

      allTimeBlocks.push(...parsedBlocks);
    });

    console.log('Processed time blocks:', allTimeBlocks);
    setTimeBlocks(allTimeBlocks);
  };

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
