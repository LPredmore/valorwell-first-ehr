
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  AvailabilityBlock, 
  AvailabilityException,
  TimeBlock,
  AppointmentBlock,
  AppointmentData
} from './types';
import { processAvailabilityWithExceptions, processAppointments } from './utils';

interface UseDayViewDataProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger: number;
  appointments: AppointmentData[];
  getClientName: (clientId: string) => string;
}

interface UseDayViewDataReturn {
  loading: boolean;
  timeBlocks: TimeBlock[];
  availabilityBlocks: AvailabilityBlock[];
  appointmentBlocks: AppointmentBlock[];
  getAvailabilityForBlock: (blockId: string) => AvailabilityBlock | undefined;
}

export const useDayViewData = ({
  currentDate,
  clinicianId,
  refreshTrigger,
  appointments,
  getClientName
}: UseDayViewDataProps): UseDayViewDataReturn => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);
  
  const dayOfWeek = format(currentDate, 'EEEE');
  const formattedDate = format(currentDate, 'yyyy-MM-dd');

  // Process appointments into appointment blocks
  useEffect(() => {
    const blocks = processAppointments(appointments, getClientName);
    setAppointmentBlocks(blocks);
  }, [appointments, getClientName]);

  // Fetch availability and exceptions
  useEffect(() => {
    const fetchAvailabilityAndExceptions = async () => {
      setLoading(true);
      try {
        let availabilityQuery = supabase
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true);

        if (clinicianId) {
          availabilityQuery = availabilityQuery.eq('clinician_id', clinicianId);
        }

        const { data: availabilityData, error: availabilityError } = await availabilityQuery;

        if (availabilityError) {
          console.error('Error fetching availability:', availabilityError);
        } else {
          console.log('DayView availability data:', availabilityData);
          setAvailabilityBlocks(availabilityData || []);
          
          if (availabilityData && availabilityData.length > 0 && clinicianId) {
            const availabilityIds = availabilityData.map(block => block.id);
            
            const { data: exceptionsData, error: exceptionsError } = await supabase
              .from('availability_exceptions')
              .select('*')
              .eq('clinician_id', clinicianId)
              .eq('specific_date', formattedDate)
              .in('original_availability_id', availabilityIds);
              
            if (exceptionsError) {
              console.error('Error fetching availability exceptions:', exceptionsError);
            } else {
              console.log('DayView exceptions data:', exceptionsData);
              setExceptions(exceptionsData || []);
            }
          }
          
          const processedBlocks = processAvailabilityWithExceptions(
            availabilityData || [], 
            exceptionsData || [],
            currentDate
          );
          setTimeBlocks(processedBlocks);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndExceptions();
  }, [dayOfWeek, clinicianId, refreshTrigger, formattedDate, currentDate]);

  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find(block => block.id === blockId);
  };

  return {
    loading,
    timeBlocks,
    availabilityBlocks,
    appointmentBlocks,
    getAvailabilityForBlock
  };
};
