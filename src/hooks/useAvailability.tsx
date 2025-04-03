
import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';

interface TimeSlot {
  date: string;
  start: string;
  end: string;
  isAvailable: boolean;
}

interface AvailabilitySettings {
  time_granularity: string;
  custom_minutes?: number;
  min_days_ahead: number;
  max_days_ahead: number;
  buffer_minutes: number;
  show_availability_to_clients: boolean;
}

interface UseAvailabilityParams {
  clinicianId: string | null;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export const useAvailability = ({
  clinicianId,
  startDate = new Date(),
  endDate = addDays(new Date(), 30),
  timezone = getUserTimeZone()
}: UseAvailabilityParams) => {
  const formattedStartDate = format(startOfDay(startDate), 'yyyy-MM-dd');
  const formattedEndDate = format(endOfDay(endDate), 'yyyy-MM-dd');

  // Query for availability settings
  const { 
    data: settings,
    isLoading: isSettingsLoading,
    error: settingsError
  } = useQuery({
    queryKey: ['availability-settings', clinicianId],
    queryFn: async () => {
      if (!clinicianId) return null;
      
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .maybeSingle();
      
      if (error) throw error;
      return data as AvailabilitySettings;
    },
    enabled: !!clinicianId
  });

  // Query for weekly availability
  const {
    data: weeklyAvailability,
    isLoading: isWeeklyLoading,
    error: weeklyError
  } = useQuery({
    queryKey: ['weekly-availability', clinicianId],
    queryFn: async () => {
      if (!clinicianId) return [];
      
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicianId
  });

  // Query for time-off blocks
  const {
    data: timeOffBlocks,
    isLoading: isTimeOffLoading,
    error: timeOffError
  } = useQuery({
    queryKey: ['time-off-blocks', clinicianId, formattedStartDate, formattedEndDate],
    queryFn: async () => {
      if (!clinicianId) return [];
      
      const { data, error } = await supabase
        .from('time_off_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true)
        .or(`start_date.lte.${formattedEndDate},end_date.gte.${formattedStartDate}`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicianId
  });

  // Function to check if a date is within a time-off block
  const isDateInTimeOff = (date: Date) => {
    if (!timeOffBlocks) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return timeOffBlocks.some(block => {
      const blockStartDate = block.start_date;
      const blockEndDate = block.end_date;
      
      return dateStr >= blockStartDate && dateStr <= blockEndDate;
    });
  };

  const isLoading = isSettingsLoading || isWeeklyLoading || isTimeOffLoading;
  const error = settingsError || weeklyError || timeOffError;

  return {
    settings,
    weeklyAvailability,
    timeOffBlocks,
    isLoading,
    error,
    isDateInTimeOff
  };
};
