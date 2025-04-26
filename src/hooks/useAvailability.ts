
import { useState, useEffect } from 'react';
import { AvailabilityService } from '@/services/availabilityService';
import { RecurringAvailabilityService } from '@/services/RecurringAvailabilityService';
import { WeeklyAvailability, DayOfWeek, AvailabilitySettings, AvailabilitySlot } from '@/types/availability';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';
import { TimeZoneService } from '@/utils/timeZoneService';

interface CreateSlotResult {
  success: boolean;
  slotId?: string;
  error?: string;
}

export const useAvailability = (clinicianId: string) => {
  // Fix: Ensure we're using a properly typed initial state
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>(createEmptyWeeklyAvailability());
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AvailabilityService.getWeeklyAvailability(clinicianId);
      // Fix: Ensure we're merging with a properly typed object
      const mergedData = {
        ...createEmptyWeeklyAvailability(),
        ...(data as Partial<WeeklyAvailability>)
      };
      setWeeklyAvailability(mergedData);
    } catch (err) {
      console.error('Error fetching weekly availability:', err);
      setError('Failed to load availability. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSettings = async () => {
    try {
      const settingsData = await AvailabilityService.getSettings(clinicianId);
      if (settingsData) {
        const fullSettings: AvailabilitySettings = {
          ...settingsData,
          createdAt: settingsData.createdAt || new Date().toISOString(),
          updatedAt: settingsData.updatedAt || new Date().toISOString()
        };
        setSettings(fullSettings);
      }
    } catch (err) {
      console.error('Error fetching availability settings:', err);
      // Don't set error state here to avoid blocking availability display
    }
  };

  useEffect(() => {
    if (clinicianId) {
      fetchAvailability();
      fetchSettings();
    }
  }, [clinicianId]);

  const createSlot = async (
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = false,
    recurrenceRule?: string,
    timezone?: string
  ): Promise<CreateSlotResult> => {
    try {
      const targetDate = getNextDayOfWeekDate(dayOfWeek);
      const dateStr = targetDate.toFormat('yyyy-MM-dd');
      
      const startIso = `${dateStr}T${startTime}`;
      const endIso = `${dateStr}T${endTime}`;
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone || 'UTC');
      
      console.log('[useAvailability] Creating slot with:', {
        dayOfWeek,
        dateStr,
        startTime,
        endTime,
        startIso,
        endIso,
        isRecurring,
        recurrenceRule,
        timezone: validTimeZone
      });

      if (isRecurring && recurrenceRule) {
        const data = await RecurringAvailabilityService.createRecurringAvailability(
          clinicianId,
          startIso,
          endIso,
          validTimeZone,
          recurrenceRule
        );
        
        if (data) {
          return {
            success: true,
            slotId: data[0]?.id
          };
        } else {
          return {
            success: false,
            error: 'Failed to create recurring availability'
          };
        }
      } else {
        const slotId = await AvailabilityService.createAvailabilitySlot(
          clinicianId, 
          {
            startTime: startIso,
            endTime: endIso,
            title: 'Available',
            recurring: false
          }
        );
        
        if (slotId) {
          return {
            success: true,
            slotId
          };
        } else {
          return {
            success: false,
            error: 'Failed to create availability slot'
          };
        }
      }
    } catch (err) {
      console.error('Error creating availability slot:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  };

  const updateSlot = async (
    slotId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      title?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const success = await AvailabilityService.updateAvailabilitySlot(slotId, updates);
      if (success) {
        await fetchAvailability();
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Failed to update availability slot'
        };
      }
    } catch (err) {
      console.error('Error updating availability slot:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  };

  const deleteSlot = async (
    slotId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const availabilitySlots = weeklyAvailability[Object.keys(weeklyAvailability)[0] as DayOfWeek];
      const slot = availabilitySlots.find(slot => slot.id === slotId);
      const isRecurring = slot?.isRecurring || false;
      
      const success = await AvailabilityService.deleteAvailabilitySlot(slotId, isRecurring);
      if (success) {
        await fetchAvailability();
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Failed to delete availability slot'
        };
      }
    } catch (err) {
      console.error('Error deleting availability slot:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  };

  const updateSettings = async (settingsUpdate: Partial<AvailabilitySettings>): Promise<boolean> => {
    try {
      const updatedSettings = await AvailabilityService.updateSettings(clinicianId, settingsUpdate);
      if (updatedSettings) {
        setSettings(updatedSettings as AvailabilitySettings | null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating availability settings:', err);
      return false;
    }
  };

  const getNextDayOfWeekDate = (dayOfWeek: DayOfWeek): DateTime => {
    const today = DateTime.now();
    const dayNumber = getDayNumber(dayOfWeek);
    const daysToAdd = (dayNumber - today.weekday + 7) % 7;
    return today.plus({ days: daysToAdd });
  };

  const getDayNumber = (dayOfWeek: DayOfWeek): number => {
    const days: Record<DayOfWeek, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };
    return days[dayOfWeek];
  };

  return {
    weeklyAvailability,
    settings,
    isLoading,
    error,
    refreshAvailability: fetchAvailability,
    createSlot,
    updateSlot,
    deleteSlot,
    updateSettings
  };
};
