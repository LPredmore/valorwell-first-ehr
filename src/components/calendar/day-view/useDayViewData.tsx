
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilityBlock, AvailabilityException, TimeBlock, AppointmentBlock, AppointmentData } from './types';
import { format, parse, startOfDay, addMinutes, isEqual, isBefore, isAfter, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Helper to convert time string to Date object for a given date
const timeToDate = (date: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

interface UseDayViewDataProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: AppointmentData[];
  getClientName?: (clientId: string) => string;
}

export const useDayViewData = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  getClientName = (clientId: string) => 'Client'
}: UseDayViewDataProps) => {
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);

  // Format date for database queries
  const formattedDate = format(currentDate, 'yyyy-MM-dd');
  const dayOfWeek = format(currentDate, 'EEEE').toLowerCase();

  // Helper function to get availability block by ID
  const getAvailabilityForBlock = useCallback((availabilityId: string) => {
    return availabilityBlocks.find(block => block.id === availabilityId);
  }, [availabilityBlocks]);

  // Fetch availability and exceptions
  useEffect(() => {
    const fetchData = async () => {
      if (!clinicianId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch regular availability for the day of the week
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('clinician_id', clinicianId)
          .eq('is_active', true);

        if (availabilityError) throw availabilityError;

        // Fetch exceptions for the specific date
        const { data: exceptionsData, error: exceptionsError } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate);

        if (exceptionsError) throw exceptionsError;

        console.log("[useDayViewData] Availability data:", availabilityData);
        console.log("[useDayViewData] Exceptions data:", exceptionsData);
        
        setAvailabilityBlocks(availabilityData || []);
        setExceptions(exceptionsData || []);
      } catch (err) {
        console.error('Error fetching availability data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clinicianId, formattedDate, dayOfWeek, refreshTrigger]);

  // Process availability and exceptions into time blocks
  useEffect(() => {
    if (!clinicianId) return;

    // Start with regular availability
    let blocks: TimeBlock[] = availabilityBlocks.map(block => ({
      start: timeToDate(currentDate, block.start_time),
      end: timeToDate(currentDate, block.end_time),
      availabilityIds: [block.id]
    }));

    // Process exceptions - they override regular availability
    const exceptionsMap = new Map<string, AvailabilityException>();
    
    // Map exceptions by original availability ID
    exceptions.forEach(exception => {
      if (exception.original_availability_id) {
        exceptionsMap.set(exception.original_availability_id, exception);
      }
    });

    // Apply exceptions to availability blocks
    const processedBlocks: TimeBlock[] = [];
    
    blocks.forEach(block => {
      const originalIds = [...block.availabilityIds];
      
      // Check if this block has any exceptions
      originalIds.forEach(id => {
        const exception = exceptionsMap.get(id);
        
        if (exception) {
          // If exception is marked as deleted, skip this block
          if (exception.is_deleted) {
            return;
          }
          
          // If exception modifies the time
          if (exception.start_time && exception.end_time) {
            processedBlocks.push({
              start: timeToDate(currentDate, exception.start_time),
              end: timeToDate(currentDate, exception.end_time),
              availabilityIds: originalIds,
              isException: true
            });
          }
        } else {
          // No exception for this block, keep it as is
          processedBlocks.push(block);
        }
      });
    });
    
    // Add any exceptions that don't reference an original availability
    exceptions.forEach(exception => {
      if (!exception.original_availability_id && !exception.is_deleted && exception.start_time && exception.end_time) {
        processedBlocks.push({
          start: timeToDate(currentDate, exception.start_time),
          end: timeToDate(currentDate, exception.end_time),
          availabilityIds: [exception.id],
          isException: true
        });
      }
    });

    setTimeBlocks(processedBlocks);
  }, [availabilityBlocks, exceptions, currentDate, clinicianId]);

  // Process appointments into appointment blocks
  useEffect(() => {
    if (!appointments || !appointments.length) {
      setAppointmentBlocks([]);
      console.log("[useDayViewData] No appointments to process");
      return;
    }

    console.log("[useDayViewData] Processing appointments for date:", formattedDate);
    
    // Filter appointments for the current date
    const todayAppointments = appointments.filter(
      apt => apt.date === formattedDate
    );

    console.log("[useDayViewData] Filtered appointments for today:", todayAppointments);

    // Convert to appointment blocks
    const blocks = todayAppointments.map(apt => {
      // Convert time strings to Date objects
      const startDate = timeToDate(currentDate, apt.start_time);
      const endDate = timeToDate(currentDate, apt.end_time);

      return {
        id: apt.id,
        clientId: apt.client_id,
        start: startDate,
        end: endDate,
        type: apt.type,
        clientName: getClientName(apt.client_id)
      };
    });

    console.log("[useDayViewData] Created appointment blocks:", blocks);
    setAppointmentBlocks(blocks);
  }, [appointments, currentDate, formattedDate, getClientName]);

  return {
    timeBlocks,
    appointmentBlocks,
    isLoading,
    error,
    availabilityBlocks,
    exceptions,
    getAvailabilityForBlock
  };
};
