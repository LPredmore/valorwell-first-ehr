
import { useState, useEffect, useCallback } from 'react';
import { WeeklyAvailability, createEmptyWeeklyAvailability, AvailabilityResponse } from '@/types/availability';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { AvailabilityMutationService } from '@/services/AvailabilityMutationService';
import { useToast } from '@/hooks/use-toast';

export const useAvailability = (clinicianId: string | null) => {
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>(createEmptyWeeklyAvailability());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch weekly availability
  const refreshAvailability = useCallback(async () => {
    if (!clinicianId) {
      setWeeklyAvailability(createEmptyWeeklyAvailability());
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[useAvailability] Fetching availability for clinician: ${clinicianId}`);
      const data = await AvailabilityQueryService.getWeeklyAvailability(clinicianId);
      console.log('[useAvailability] Retrieved availability data:', data);
      setWeeklyAvailability(data);
    } catch (err) {
      console.error('[useAvailability] Error fetching availability:', err);
      setError('Failed to load availability schedule');
      toast({
        title: 'Error',
        description: 'Failed to load availability schedule',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clinicianId, toast]);
  
  // Create a new availability slot
  const createSlot = useCallback(async (
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    isRecurring: boolean = false,
    recurrenceRule?: string
  ): Promise<boolean> => {
    if (!clinicianId) return false;
    
    try {
      const response = await AvailabilityMutationService.createAvailabilitySlot(
        clinicianId,
        {
          startTime,
          endTime,
          title: 'Available',
          recurring: isRecurring,
          recurrenceRule,
          dayOfWeek
        }
      );
      
      if (response.success) {
        await refreshAvailability();
        toast({
          title: 'Success',
          description: 'Availability slot created successfully',
        });
        return true;
      } else {
        console.error('[useAvailability] Error creating slot:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to create availability slot',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      console.error('[useAvailability] Exception creating slot:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [clinicianId, refreshAvailability, toast]);
  
  // Update an existing slot
  const updateSlot = useCallback(async (
    slotId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      title?: string;
    },
    updateAll: boolean = false
  ): Promise<boolean> => {
    try {
      const response = await AvailabilityMutationService.updateAvailabilitySlot(
        slotId,
        updates,
        updateAll
      );
      
      if (response.success) {
        await refreshAvailability();
        toast({
          title: 'Success',
          description: 'Availability updated successfully',
        });
        return true;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update availability',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      console.error('[useAvailability] Error updating slot:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshAvailability, toast]);
  
  // Delete a slot
  const deleteSlot = useCallback(async (
    slotId: string,
    deleteAll: boolean = false
  ): Promise<boolean> => {
    try {
      const response = await AvailabilityMutationService.deleteAvailabilitySlot(
        slotId,
        deleteAll
      );
      
      if (response.success) {
        await refreshAvailability();
        toast({
          title: 'Success',
          description: 'Availability slot deleted successfully',
        });
        return true;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete availability slot',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      console.error('[useAvailability] Error deleting slot:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [refreshAvailability, toast]);
  
  // Load availability on mount or when clinician changes
  useEffect(() => {
    if (clinicianId) {
      refreshAvailability();
    }
  }, [clinicianId, refreshAvailability]);
  
  return {
    weeklyAvailability,
    isLoading,
    error,
    refreshAvailability,
    createSlot,
    updateSlot,
    deleteSlot
  };
};
