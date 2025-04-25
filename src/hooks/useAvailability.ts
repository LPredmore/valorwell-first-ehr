
import { useState, useEffect, useCallback } from 'react';
import { WeeklyAvailability, AvailabilitySettings, AvailabilitySlot } from '@/types/availability';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { AvailabilityMutationService } from '@/services/AvailabilityMutationService';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook for managing availability data
 * This provides a consistent interface for components to interact with availability
 */
export function useAvailability(clinicianId: string | null) {
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch weekly availability
  const fetchWeeklyAvailability = useCallback(async () => {
    if (!clinicianId) return;
    
    try {
      setIsLoadingAvailability(true);
      setError(null);
      
      const availability = await AvailabilityQueryService.getWeeklyAvailability(clinicianId);
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

  // Fetch availability settings
  const fetchSettings = useCallback(async () => {
    if (!clinicianId) return;
    
    try {
      setIsLoadingSettings(true);
      setError(null);
      
      const settingsData = await AvailabilityQueryService.getSettings(clinicianId);
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

  // Update availability settings
  const updateSettings = useCallback(
    async (updatedSettings: Partial<AvailabilitySettings>): Promise<boolean> => {
      if (!clinicianId) return false;
      
      try {
        setIsLoadingSettings(true);
        setError(null);
        
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

  // Create a new availability slot
  const createSlot = useCallback(
    async (
      dayOfWeek: string,
      startTime: string,
      endTime: string,
      isRecurring: boolean = false,
      recurrenceRule?: string
    ): Promise<boolean> => {
      if (!clinicianId) return false;
      
      try {
        const result = await AvailabilityMutationService.createAvailabilitySlot(clinicianId, {
          startTime,
          endTime,
          recurring: isRecurring,
          recurrenceRule,
          dayOfWeek
        });
        
        if (result.success) {
          // Refresh the availability data
          await fetchWeeklyAvailability();
          
          toast({
            title: 'Slot Created',
            description: 'Availability slot has been created successfully.',
          });
          return true;
        } else {
          throw new Error(result.error || 'Failed to create slot');
        }
        
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useAvailability] Error creating availability slot:', err);
        setError(`Failed to create availability slot: ${error}`);
        toast({
          title: 'Error',
          description: `Failed to create availability slot. ${error}`,
          variant: 'destructive',
        });
        return false;
      }
    },
    [clinicianId, fetchWeeklyAvailability, toast]
  );

  // Update an existing availability slot
  const updateSlot = useCallback(
    async (
      slotId: string,
      updates: { startTime?: string; endTime?: string },
      updateRecurrence: boolean = false
    ): Promise<boolean> => {
      if (!clinicianId) return false;
      
      try {
        const result = await AvailabilityMutationService.updateAvailabilitySlot(
          slotId,
          updates,
          updateRecurrence
        );
        
        if (result.success) {
          // Refresh the availability data
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
        toast({
          title: 'Error',
          description: `Failed to update availability slot. ${error}`,
          variant: 'destructive',
        });
        return false;
      }
    },
    [clinicianId, fetchWeeklyAvailability, toast]
  );

  // Delete an availability slot
  const deleteSlot = useCallback(
    async (slotId: string, deleteRecurrence: boolean = false): Promise<boolean> => {
      if (!clinicianId) return false;
      
      try {
        const result = await AvailabilityMutationService.deleteAvailabilitySlot(
          slotId,
          deleteRecurrence
        );
        
        if (result.success) {
          // Refresh the availability data
          await fetchWeeklyAvailability();
          
          toast({
            title: 'Slot Deleted',
            description: 'Availability slot has been deleted successfully.',
          });
          return true;
        } else {
          throw new Error(result.error || 'Failed to delete slot');
        }
        
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useAvailability] Error deleting availability slot:', err);
        setError(`Failed to delete availability slot: ${error}`);
        toast({
          title: 'Error',
          description: `Failed to delete availability slot. ${error}`,
          variant: 'destructive',
        });
        return false;
      }
    },
    [clinicianId, fetchWeeklyAvailability, toast]
  );

  // Initialize the data
  useEffect(() => {
    if (clinicianId) {
      fetchWeeklyAvailability();
      fetchSettings();
    }
  }, [clinicianId, fetchWeeklyAvailability, fetchSettings]);

  // Return the data and functions
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
