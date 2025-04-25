
import { useState, useEffect, useCallback } from 'react';
import { WeeklyAvailability, AvailabilitySettings, AvailabilitySlot } from '@/types/availability';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { AvailabilityMutationService } from '@/services/AvailabilityMutationService';
import { useToast } from '@/hooks/use-toast';

interface MutationResult {
  success: boolean;
  error?: string;
  id?: string;
}

export function useAvailability(clinicianId: string | null) {
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWeeklyAvailability = useCallback(async () => {
    if (!clinicianId) return;
    
    try {
      setIsLoadingAvailability(true);
      setError(null);
      
      console.log(`[useAvailability] Fetching weekly availability for clinician: ${clinicianId}`);
      const availability = await AvailabilityQueryService.getWeeklyAvailability(clinicianId);
      console.log('[useAvailability] Received weekly availability:', availability);
      
      setWeeklyAvailability(availability);
      
    } catch (err) {
      console.error('[useAvailability] Error fetching weekly availability:', err);
      setError('Failed to load availability schedule');
      toast({
        title: 'Error',
        description: 'Failed to load availability schedule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [clinicianId, toast]);

  const fetchSettings = useCallback(async () => {
    if (!clinicianId) return;
    
    try {
      setIsLoadingSettings(true);
      setError(null);
      
      console.log(`[useAvailability] Fetching availability settings for clinician: ${clinicianId}`);
      const settingsData = await AvailabilityQueryService.getSettings(clinicianId);
      console.log('[useAvailability] Received settings:', settingsData);
      
      setSettings(settingsData);
      
    } catch (err) {
      console.error('[useAvailability] Error fetching availability settings:', err);
      setError('Failed to load availability settings');
      toast({
        title: 'Error',
        description: 'Failed to load availability settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [clinicianId, toast]);

  const updateSettings = useCallback(
    async (updatedSettings: Partial<AvailabilitySettings>): Promise<boolean> => {
      if (!clinicianId) return false;
      
      try {
        setIsLoadingSettings(true);
        setError(null);
        
        console.log(`[useAvailability] Updating availability settings:`, updatedSettings);
        const result = await AvailabilityMutationService.updateSettings(clinicianId, updatedSettings);
        
        if (result) {
          setSettings(result);
          toast({
            title: 'Settings Updated',
            description: 'Availability settings have been updated successfully.',
          });
          return true;
        } else {
          throw new Error('Failed to update settings');
        }
        
      } catch (err) {
        console.error('[useAvailability] Error updating availability settings:', err);
        setError('Failed to update availability settings');
        toast({
          title: 'Error',
          description: 'Failed to update availability settings. Please try again.',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoadingSettings(false);
      }
    },
    [clinicianId, toast]
  );

  const createSlot = useCallback(
    async (
      dayOfWeek: string,
      startTime: string,
      endTime: string,
      isRecurring: boolean = false,
      recurrenceRule?: string
    ): Promise<MutationResult> => {
      if (!clinicianId) return { success: false, error: 'No clinician ID provided' };
      
      try {
        console.log(`[useAvailability] Creating availability slot:`, { 
          dayOfWeek,
          startTime, 
          endTime, 
          isRecurring,
          recurrenceRule 
        });
        
        if (!startTime || !endTime) {
          return { success: false, error: 'Start time and end time are required' };
        }
        
        if (startTime >= endTime) {
          return { success: false, error: 'End time must be later than start time' };
        }
        
        if (isRecurring && !recurrenceRule) {
          return { success: false, error: 'Recurrence rule is required for recurring availability' };
        }
        
        const result = await AvailabilityMutationService.createAvailabilitySlot(clinicianId, {
          startTime,
          endTime,
          recurring: isRecurring,
          recurrenceRule,
          title: 'Available'
        });
        
        if (result.success) {
          await fetchWeeklyAvailability();
          
          toast({
            title: 'Slot Created',
            description: 'Availability slot has been created successfully.',
          });
          return { success: true, id: result.id };
        } else {
          const errorMessage = result.error || 'Failed to create slot';
          console.error(`[useAvailability] Error creating slot: ${errorMessage}`);
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useAvailability] Error creating availability slot:', err);
        
        let errorMessage = error;
        if (error.includes('timezone')) {
          errorMessage = 'There was a problem with timezone conversion. Please check your profile timezone settings.';
        } else if (error.includes('overlapping')) {
          errorMessage = 'This time slot overlaps with an existing availability slot.';
        } else if (error.includes('recurrence')) {
          errorMessage = 'There was a problem creating the recurring schedule. Please try again.';
        } else if (error.includes('day_of_week')) {
          errorMessage = 'There was an issue with the day of week configuration. Please try again.';
        }
        
        toast({
          title: 'Error',
          description: `Failed to create availability slot. ${errorMessage}`,
          variant: 'destructive',
        });
        
        return { success: false, error: errorMessage };
      }
    },
    [clinicianId, fetchWeeklyAvailability, toast]
  );

  const updateSlot = useCallback(
    async (
      slotId: string,
      updates: { startTime?: string; endTime?: string }
    ): Promise<boolean> => {
      if (!clinicianId) return false;
      
      try {
        console.log(`[useAvailability] Updating availability slot:`, { slotId, updates });
        
        if (updates.startTime && updates.endTime && updates.startTime >= updates.endTime) {
          toast({
            title: 'Invalid Time Range',
            description: 'End time must be later than start time.',
            variant: 'destructive',
          });
          return false;
        }
        
        const result = await AvailabilityMutationService.updateAvailabilitySlot(slotId, updates);
        
        if (result.success) {
          await fetchWeeklyAvailability();
          
          toast({
            title: 'Slot Updated',
            description: 'Availability slot has been updated successfully.',
          });
          return true;
        } else {
          throw new Error(result.error || 'Failed to update slot');
        }
        
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useAvailability] Error updating availability slot:', err);
        setError(`Failed to update availability slot: ${error}`);
        
        let errorMessage = error;
        if (error.includes('timezone')) {
          errorMessage = 'There was a problem with timezone conversion. Please check your profile timezone settings.';
        } else if (error.includes('overlapping')) {
          errorMessage = 'This time slot would overlap with an existing availability slot.';
        }
        
        toast({
          title: 'Error',
          description: `Failed to update availability slot. ${errorMessage}`,
          variant: 'destructive',
        });
        return false;
      }
    },
    [clinicianId, fetchWeeklyAvailability, toast]
  );

  const deleteSlot = useCallback(
    async (slotId: string): Promise<MutationResult> => {
      if (!clinicianId) return { success: false, error: 'No clinician ID provided' };
      
      try {
        console.log(`[useAvailability] Deleting availability slot:`, { slotId });
        const result = await AvailabilityMutationService.deleteAvailabilitySlot(slotId);
        
        if (result.success) {
          await fetchWeeklyAvailability();
          
          toast({
            title: 'Slot Deleted',
            description: 'Availability slot has been deleted successfully.',
          });
          return { success: true };
        } else {
          throw new Error(result.error || 'Failed to delete slot');
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useAvailability] Error deleting availability slot:', err);
        
        toast({
          title: 'Error',
          description: `Failed to delete availability slot. ${error}`,
          variant: 'destructive',
        });
        
        return { success: false, error };
      }
    },
    [clinicianId, fetchWeeklyAvailability, toast]
  );

  useEffect(() => {
    if (clinicianId) {
      console.log(`[useAvailability] Initializing with clinicianId: ${clinicianId}`);
      fetchWeeklyAvailability();
      fetchSettings();
    }
  }, [clinicianId, fetchWeeklyAvailability, fetchSettings]);

  return {
    weeklyAvailability,
    settings,
    isLoading: isLoadingAvailability || isLoadingSettings,
    error,
    refreshAvailability: fetchWeeklyAvailability,
    refreshSettings: fetchSettings,
    updateSettings,
    createSlot,
    updateSlot,
    deleteSlot
  };
}
