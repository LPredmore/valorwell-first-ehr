
import { useState, useEffect } from 'react';
import { format, startOfDay, setHours, setMinutes } from 'date-fns';
import { 
  AvailabilityBlock, 
  AvailabilityException, 
  TimeBlock 
} from '../types/availability-types';

export const useAvailabilityProcessing = (
  days: Date[],
  availabilityBlocks: AvailabilityBlock[],
  exceptions: AvailabilityException[]
) => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  useEffect(() => {
    console.log('Processing availability with exceptions:', {
      availabilityBlocks,
      exceptions,
      days
    });
    processAvailabilityWithExceptions(availabilityBlocks, exceptions);
  }, [availabilityBlocks, exceptions, days]);

  const processAvailabilityWithExceptions = (
    blocks: AvailabilityBlock[], 
    exceptionsData: AvailabilityException[]
  ) => {
    const allTimeBlocks: TimeBlock[] = [];

    // Group exceptions by date for faster lookup
    const exceptionsByDate = exceptionsData.reduce((acc, exception) => {
      if (!acc[exception.specific_date]) {
        acc[exception.specific_date] = [];
      }
      acc[exception.specific_date].push(exception);
      return acc;
    }, {} as Record<string, AvailabilityException[]>);

    console.log('Exceptions grouped by date:', exceptionsByDate);

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dateStr = format(day, 'yyyy-MM-dd');
      const exceptionsForDay = exceptionsByDate[dateStr] || [];
      
      console.log(`Processing day ${dateStr} (${dayOfWeek}):`);
      console.log(`Exceptions for this day:`, exceptionsForDay);
      
      // Create a map to track which recurring blocks should be excluded
      // Key: availability_id, Value: boolean (true = exclude)
      const excludedRecurringIds = new Map<string, boolean>();
      
      // First, identify which recurring blocks should be excluded due to exceptions
      exceptionsForDay.forEach(exception => {
        if (exception.original_availability_id) {
          // If this is an exception to a recurring availability, mark the original for exclusion
          console.log(`Marking recurring block ${exception.original_availability_id} as excluded due to exception:`, exception);
          excludedRecurringIds.set(exception.original_availability_id, true);
        }
      });
      
      console.log(`Excluded recurring IDs for ${dateStr}:`, Array.from(excludedRecurringIds.keys()));
      
      // Get recurring availability blocks for this day of week, EXCLUDING those with exceptions
      const dayBlocks = blocks
        .filter(block => block.day_of_week === dayOfWeek)
        .filter(block => !excludedRecurringIds.has(block.id));

      console.log(`Recurring blocks for ${dayOfWeek} after filtering:`, dayBlocks);

      // Get exception blocks for this specific date (both modified recurring and standalone)
      // Only include exceptions that are NOT deleted (is_deleted: false)
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

  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find(block => block.id === blockId);
  };

  return { timeBlocks, getAvailabilityForBlock };
};
