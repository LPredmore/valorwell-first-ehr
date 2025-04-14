
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureIANATimeZone } from "@/utils/timeZoneUtils";

/**
 * Hook to fetch a user's time zone from the profiles table
 * @param userId The user ID to fetch the time zone for
 * @returns An object containing the time zone, loading state, and error
 */
export const useUserTimeZone = (userId: string | null) => {
  const [timeZone, setTimeZone] = useState<string>('America/Chicago'); // Default time zone
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserTimeZone = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('time_zone')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user time zone:', error);
          throw error;
        }

        if (data && data.time_zone) {
          const validTimeZone = ensureIANATimeZone(data.time_zone);
          console.log(`[useUserTimeZone] Fetched time zone for user ${userId}: ${validTimeZone}`);
          setTimeZone(validTimeZone);
        } else {
          console.log(`[useUserTimeZone] No time zone found for user ${userId}, using default`);
        }
      } catch (err) {
        console.error('Error in useUserTimeZone:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTimeZone();
  }, [userId]);

  return { timeZone, loading, error };
};

/**
 * Utility function to get a user's time zone directly (not as a hook)
 * @param userId The user ID to fetch the time zone for
 * @returns The user's time zone or a default
 */
export const getUserTimeZoneById = async (userId: string): Promise<string> => {
  if (!userId) return 'America/Chicago';
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('time_zone')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user time zone by ID:', error);
      return 'America/Chicago'; // Default to Central Time on error
    }
    
    // Return the time zone or a default if not set
    return ensureIANATimeZone(data?.time_zone || 'America/Chicago');
  } catch (error) {
    console.error('Exception in getUserTimeZoneById:', error);
    return 'America/Chicago'; // Default to Central Time on error
  }
};
