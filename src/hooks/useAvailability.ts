
import { useState, useEffect, useCallback } from 'react';
import { availabilityService } from '@/services/availabilityService';
import { AvailabilitySettings, AvailabilitySlot, DayOfWeek, WeeklyAvailability } from '@/types/availability';
import { TimeZoneService } from '@/utils/timezone';
import { CalendarErrorHandler } from '@/services/calendar/CalendarErrorHandler';
import { DateTime } from 'luxon';

interface AvailabilitySlotResult {
  success: boolean;
  error?: string;
  slotId?: string;
}

export const useAvailability = (clinicianId: string | null) => {
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Alias for consistency
  const [error, setError] = useState<Error | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!clinicianId) {
      setLoading(false);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[useAvailability] Fetching settings for clinician:', clinicianId);
      setLoading(true);
      setIsLoading(true);
      const data = await availabilityService.getSettingsForClinician(clinicianId);
      console.log('[useAvailability] Retrieved settings:', data);
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('[useAvailability] Error fetching settings:', err);
      setError(CalendarErrorHandler.formatError(err));
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [clinicianId]);

  const fetchWeeklyAvailability = useCallback(async () => {
    if (!clinicianId) {
      setWeeklyAvailability(null);
      return;
    }

    try {
      console.log('[useAvailability] Fetching weekly availability for clinician:', clinicianId);
      setLoading(true);
      setIsLoading(true);
      const data = await availabilityService.getWeeklyAvailabilityForClinician(clinicianId);
      setWeeklyAvailability(data);
      setError(null);
    } catch (err) {
      console.error('[useAvailability] Error fetching weekly availability:', err);
      setError(CalendarErrorHandler.formatError(err));
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [clinicianId]);

  const refreshAvailability = useCallback(async () => {
    await Promise.all([fetchSettings(), fetchWeeklyAvailability()]);
  }, [fetchSettings, fetchWeeklyAvailability]);

  useEffect(() => {
    refreshAvailability();
  }, [refreshAvailability]);

  const createSlot = useCallback(async (
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone?: string,
    specificDate?: string | Date | DateTime
  ): Promise<AvailabilitySlotResult> => {
    if (!clinicianId) {
      return { success: false, error: 'No clinician ID provided' };
    }

    try {
      console.log('[useAvailability] Creating availability slot:', {
        clinicianId,
        dayOfWeek,
        startTime,
        endTime,
        timeZone,
        specificDate: specificDate ? 
          (specificDate instanceof DateTime ? 
            specificDate.toISODate() : 
            String(specificDate)
          ) : 'none'
      });

      // Make sure we pass the right parameters to createAvailabilitySlot
      const result = await availabilityService.createAvailabilitySlot(
        clinicianId,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        recurrenceRule,
        timeZone,
        specificDate
      );

      await fetchWeeklyAvailability();
      
      // Fix the type safety issue for the result - add null check
      const slotId = result ? (typeof result === 'object' && result.id ? result.id : String(result || '')) : undefined;
      return { success: true, slotId };
    } catch (err) {
      const error = CalendarErrorHandler.formatError(err);
      console.error('[useAvailability] Error creating slot:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }, [clinicianId, fetchWeeklyAvailability]);

  const updateSlot = useCallback(async (
    slotId: string,
    updates: Partial<AvailabilitySlot>
  ): Promise<AvailabilitySlotResult> => {
    if (!clinicianId || !slotId) {
      return { success: false, error: 'Missing required parameters' };
    }

    try {
      await availabilityService.updateAvailabilitySlot(slotId, updates);
      await fetchWeeklyAvailability();
      return { success: true, slotId };
    } catch (err) {
      console.error('Error updating availability slot:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update availability slot' 
      };
    }
  }, [clinicianId, fetchWeeklyAvailability]);

  const deleteSlot = useCallback(async (
    slotId: string
  ): Promise<AvailabilitySlotResult> => {
    if (!clinicianId || !slotId) {
      return { success: false, error: 'Missing required parameters' };
    }

    try {
      await availabilityService.deleteAvailabilitySlot(slotId);
      await fetchWeeklyAvailability();
      return { success: true };
    } catch (err) {
      console.error('Error deleting availability slot:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete availability slot' 
      };
    }
  }, [clinicianId, fetchWeeklyAvailability]);

  const updateSettings = useCallback(async (
    updatedSettings: Partial<AvailabilitySettings>
  ) => {
    if (!clinicianId) {
      return false;
    }

    try {
      await availabilityService.updateSettings(clinicianId, updatedSettings);
      await fetchSettings();
      return true;
    } catch (err) {
      console.error('Error updating availability settings:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return false;
    }
  }, [clinicianId, fetchSettings]);

  return {
    settings,
    loading,
    isLoading,
    error,
    weeklyAvailability,
    refreshAvailability,
    createSlot,
    updateSlot,
    deleteSlot,
    updateSettings
  };
};
