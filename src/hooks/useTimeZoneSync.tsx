import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';
import { supabase } from '@/integrations/supabase/client';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/hooks/use-toast';

interface UseTimeZoneSyncProps {
  userId: string | null;
}

interface UseTimeZoneSyncResult {
  timeZone: string;
  isLoading: boolean;
  error: Error | null;
  syncTimeZone: () => Promise<void>;
  updateTimeZone: (newTimeZone: string) => Promise<void>;
}

export const useTimeZoneSync = ({ userId }: UseTimeZoneSyncProps): UseTimeZoneSyncResult => {
  const { userTimeZone, isLoading: isContextLoading, updateUserTimeZone } = useTimeZone();
  const [isLoading, setIsLoading] = useState(isContextLoading);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Use Intl API directly instead of relying on getUserTimeZone
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);

  // Synchronize time zone when component mounts
  useEffect(() => {
    if (!isContextLoading && userId && browserTimeZone !== timeZone) {
      console.log('[useTimeZoneSync] Browser timezone differs from user timezone', {
        browser: browserTimeZone,
        user: timeZone
      });
    }
  }, [isContextLoading, userId, browserTimeZone, timeZone]);

  // Sync the user's timezone with the browser timezone
  const syncTimeZone = async (): Promise<void> => {
    if (!userId) {
      console.log('[useTimeZoneSync] Cannot sync timezone: No authenticated user');
      return;
    }
    
    try {
      setIsLoading(true);
      await updateTimeZone(browserTimeZone);
      
      toast({
        title: "Timezone Updated",
        description: `Timezone synchronized to ${TimeZoneService.formatTimeZoneDisplay(browserTimeZone)}`
      });
    } catch (err) {
      console.error('[useTimeZoneSync] Failed to sync timezone:', err);
      setError(err as Error);
      
      toast({
        title: "Timezone Sync Failed",
        description: "Could not update your timezone settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeZone = async (newTimeZone: string): Promise<void> => {
    if (!userId) {
      throw new Error("Cannot update timezone: No authenticated user");
    }
    
    try {
      setIsLoading(true);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(newTimeZone);
      
      if (updateUserTimeZone) {
        await updateUserTimeZone(validTimeZone);
      } else {
        // Fallback if context method not available
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ time_zone: validTimeZone })
          .eq('id', userId);

        if (updateError) throw updateError;
      }
      
      console.log(`[useTimeZoneSync] Updated user timezone to ${validTimeZone}`);
    } catch (err) {
      console.error('[useTimeZoneSync] Error updating timezone:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    timeZone,
    isLoading,
    error,
    syncTimeZone,
    updateTimeZone
  };
};
