
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureIANATimeZone } from "@/utils/timeZoneUtils";

/**
 * Hook to fetch a user's time zone from the database
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
        
        // Get time zone using the unified function
        const userTimeZone = await getUserTimeZoneById(userId);
        setTimeZone(userTimeZone);
        console.log(`[useUserTimeZone] Set time zone for user ${userId}: ${userTimeZone}`);
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
 * Checks multiple sources (clients, clinicians) for better consistency
 * @param userId The user ID to fetch the time zone for
 * @returns The user's time zone or a default
 */
export const getUserTimeZoneById = async (userId: string): Promise<string> => {
  if (!userId) return 'America/Chicago';
  
  try {
    // First try to get from clients table
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('client_time_zone')
      .eq('id', userId)
      .single();
      
    if (!clientError && clientData?.client_time_zone) {
      console.log(`[getUserTimeZoneById] Found time zone in clients table for ${userId}: ${clientData.client_time_zone}`);
      return ensureIANATimeZone(clientData.client_time_zone);
    }
    
    // If not in clients, check if it's a clinician and get from clinicians table
    const { data: clinicianData, error: clinicianError } = await supabase
      .from('clinicians')
      .select('clinician_time_zone')
      .eq('id', userId)
      .single();
      
    if (!clinicianError && clinicianData?.clinician_time_zone) {
      console.log(`[getUserTimeZoneById] Found time zone in clinicians table for ${userId}: ${clinicianData.clinician_time_zone}`);
      return ensureIANATimeZone(clinicianData.clinician_time_zone);
    }
    
    // Return default if not found anywhere
    console.log(`[getUserTimeZoneById] No time zone found for user ${userId} in any table, using default`);
    return 'America/Chicago';
  } catch (error) {
    console.error('Exception in getUserTimeZoneById:', error);
    return 'America/Chicago'; // Default to Central Time on error
  }
};
