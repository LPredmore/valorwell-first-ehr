import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Appointment } from '@/types/appointment';
import { TimeBlock, AppointmentBlock, AvailabilityBlock, AvailabilityException } from './types';
import { DateTime } from 'luxon';

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

  const dayOfWeek = days.map(day => format(day, 'EEEE'));
  const formattedDates = days.map(day => format(day, 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchAvailabilityAndExceptions = async () => {
      setLoading(true);
      try {
        // Fetch availability blocks for the week
        const availabilityPromises = dayOfWeek.map(async (day) => {
          let availabilityQuery = supabase
            .from('availability')
            .select('*')
            .eq('day_of_week', day)
            .eq('is_active', true);

          if (clinicianId) {
            availabilityQuery = availabilityQuery.eq('clinician_id', clinicianId);
          }

          const { data, error } = await availabilityQuery;

          if (error) {
            console.error('Error fetching availability:', error);
            return [];
          } else {
            return data || [];
          }
        });

        const allAvailabilityData = (await Promise.all(availabilityPromises)).flat();
        setAvailabilityBlocks(allAvailabilityData);

        // Fetch availability exceptions for the week
        const exceptionsPromises = formattedDates.map(async (date) => {
          if (!clinicianId) return [];

          const { data: exceptionsData, error: exceptionsError } = await supabase
            .from('availability_exceptions')
            .select('*')
            .eq('clinician_id', clinicianId)
            .eq('specific_date', date);

          if (exceptionsError) {
            console.error('Error fetching availability exceptions:', exceptionsError);
            return [];
          } else {
            return exceptionsData || [];
          }
        });

        const allExceptionsData = (await Promise.all(exceptionsPromises)).flat();
        setExceptions(allExceptionsData);

        processAvailabilityWithExceptions(allAvailabilityData, allExceptionsData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndExceptions();
  }, [days, clinicianId, refreshTrigger, userTimeZone]);

  useEffect(() => {
    const blocks = processAppointments();
    setAppointmentBlocks(blocks);
  }, [appointments, days, userTimeZone, getClientName]);

  const processAvailabilityWithExceptions = (blocks: AvailabilityBlock[], exceptions: AvailabilityException[]) => {
    if (!blocks.length && !exceptions.length) {
      setTimeBlocks([]);
      return;
    }

    const exceptionsMap: Record<string, AvailabilityException> = {};
    exceptions.forEach(exception => {
      exceptionsMap[exception.original_availability_id] = exception;
    });

    const effectiveBlocks = blocks
      .filter(block => {
        const exception = exceptionsMap[block.id];
        return !exception || !exception.is_deleted;
      })
      .map(block => {
        const exception = exceptionsMap[block.id];

        if (exception && exception.start_time && exception.end_time) {
          return {
            ...block,
            start_time: exception.start_time,
            end_time: exception.end_time,
            isException: true,
          };
        }

        return block;
      });

    const parsedBlocks: TimeBlock[] = [];

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const formattedDate = format(day, 'yyyy-MM-dd');

      const dayBlocks = effectiveBlocks.filter(block => block.day_of_week === dayOfWeek);
      const dayExceptions = exceptions.filter(exception => exception.specific_date === formattedDate);

      dayBlocks.forEach(block => {
        const [startHour, startMinute] = block.start_time.split(':').map(Number);
        const [endHour, endMinute] = block.end_time.split(':').map(Number);

        const start = TimeZoneService.fromJSDate(day, userTimeZone).set({
          hour: startHour,
          minute: startMinute,
          second: 0,
          millisecond: 0
        });

        const end = TimeZoneService.fromJSDate(day, userTimeZone).set({
          hour: endHour,
          minute: endMinute,
          second: 0,
          millisecond: 0
        });

        parsedBlocks.push({
          start,
          end,
          availabilityIds: [block.id],
          isException: block.isException,
          day: TimeZoneService.fromJSDate(day, userTimeZone)
        });
      });

      dayExceptions.forEach(exception => {
        if (exception.start_time && exception.end_time) {
          const [startHour, startMinute] = exception.start_time.split(':').map(Number);
          const [endHour, endMinute] = exception.end_time.split(':').map(Number);

          const start = TimeZoneService.fromJSDate(day, userTimeZone).set({
            hour: startHour,
            minute: startMinute,
            second: 0,
            millisecond: 0
          });

          const end = TimeZoneService.fromJSDate(day, userTimeZone).set({
            hour: endHour,
            minute: endMinute,
            second: 0,
            millisecond: 0
          });

          parsedBlocks.push({
            start,
            end,
            availabilityIds: [exception.id],
            isException: true,
            isStandalone: true,
            day: TimeZoneService.fromJSDate(day, userTimeZone)
          });
        }
      });
    });

    parsedBlocks.sort((a, b) => a.start.toMillis() - b.start.toMillis());

    const mergedBlocks: TimeBlock[] = [];

    parsedBlocks.forEach(block => {
      const lastBlock = mergedBlocks[mergedBlocks.length - 1];

      if (lastBlock && block.start <= lastBlock.end) {
        if (block.end > lastBlock.end) {
          lastBlock.end = block.end;
        }
        lastBlock.availabilityIds.push(block.availabilityIds[0]);
        if (block.isException) {
          lastBlock.isException = true;
        }
      } else {
        mergedBlocks.push({
          start: block.start,
          end: block.end,
          availabilityIds: [block.availabilityIds[0]],
          isException: block.isException,
          isStandalone: block.isStandalone,
          day: block.day
        });
      }
    });

    setTimeBlocks(mergedBlocks);
  };
  
  // Process appointments into blocks
  const processAppointments = () => {
    // Convert days array to DateTime objects for easier comparison
    const daysAsDateTime = days.map(day => 
      TimeZoneService.fromJSDate(day, userTimeZone)
    );
    
    const blocks: AppointmentBlock[] = appointments
      .map(appointment => {
        // Skip invalid data
        if (!appointment.start_at || !appointment.end_at) {
          console.error("[useWeekViewData] Invalid appointment data:", appointment);
          return null;
        }
        
        // Get the day in the user's timezone from the UTC timestamp
        const startDateTime = TimeZoneService.fromUTC(appointment.start_at, userTimeZone);
        const endDateTime = TimeZoneService.fromUTC(appointment.end_at, userTimeZone);
        
        // Find which day of the week this appointment falls on
        const matchingDay = daysAsDateTime.find(day => 
          TimeZoneService.isSameDay(startDateTime, day)
        );
        
        if (!matchingDay) {
          return null;
        }
        
        return {
          id: appointment.id,
          day: matchingDay,
          start: startDateTime,
          end: endDateTime,
          clientId: appointment.client_id,
          type: appointment.type,
          clientName: appointment.clientName || getClientName(appointment.client_id)
        };
      })
      .filter(block => block !== null) as AppointmentBlock[];
    
    return blocks;
  };

  const isTimeSlotAvailable = (day: Date, timeSlot: Date) => {
    return timeBlocks.some(block => {
      const slotTime = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      const blockStart = block.start;
      const blockEnd = block.end;
      return slotTime >= blockStart && slotTime < blockEnd && TimeZoneService.isSameDay(slotTime, block.day!);
    });
  };

  const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
    return timeBlocks.find(block => {
      const slotTime = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      const blockStart = block.start;
      const blockEnd = block.end;
      return slotTime >= blockStart && slotTime < blockEnd && TimeZoneService.isSameDay(slotTime, block.day!);
    });
  };

  const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
    return appointmentBlocks.find(block => {
      const slotTime = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      const blockStart = block.start;
      const blockEnd = block.end;
      return slotTime >= blockStart && slotTime < blockEnd && TimeZoneService.isSameDay(slotTime, block.day!);
    });
  };

  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find(block => block.id === blockId);
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
