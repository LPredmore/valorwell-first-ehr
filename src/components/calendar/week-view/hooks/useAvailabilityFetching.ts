
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilityBlock, AvailabilityException } from '../types/availability-types';

export const useAvailabilityFetching = (
  days: Date[],
  clinicianId: string | null,
  refreshTrigger: number = 0
) => {
  const [loading, setLoading] = useState(true);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

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
          return { availabilityData: [], exceptionsData: [] };
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
              return { availabilityData: availabilityData || [], exceptionsData: [] };
            } else {
              console.log('WeekView exceptions data:', exceptionsData);
              setExceptions(exceptionsData || []);
              return { availabilityData: availabilityData || [], exceptionsData: exceptionsData || [] };
            }
          } else {
            setExceptions([]);
            return { availabilityData: availabilityData || [], exceptionsData: [] };
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setAvailabilityBlocks([]);
        setExceptions([]);
        return { availabilityData: [], exceptionsData: [] };
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger, days]);

  return { loading, availabilityBlocks, exceptions };
};
