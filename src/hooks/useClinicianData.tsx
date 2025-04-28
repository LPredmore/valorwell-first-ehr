
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clinician } from "@/types/client";
import { getUserTimeZoneById } from "./useUserTimeZone";
import { useUser } from "@/context/UserContext";

export const useClinicianData = (clinicianId?: string) => {
  // Get the current user's ID if no clinicianId is provided
  const { userId: currentUserId } = useUser();
  const [clinicianData, setClinicianData] = useState<Clinician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClinicianData = async () => {
      try {
        setLoading(true);
        
        // If clinicianId is provided, fetch that specific clinician
        // Otherwise, use the current user's ID
        const targetId = clinicianId || currentUserId;
        
        console.log('[useClinicianData] Clinician data request:', {
          providedClinicianId: clinicianId,
          currentUserId,
          targetId,
          usingCurrentUserAsFallback: !clinicianId && !!currentUserId
        });
        
        if (!targetId) {
          console.warn('[useClinicianData] No clinician ID or current user ID available');
          setLoading(false);
          return;
        }
        
        console.log(`[useClinicianData] Fetching clinician data for ID: ${targetId}`);
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', targetId)
          .single();

        if (error) {
          throw error;
        }

        setClinicianData(data);
      } catch (err) {
        console.error('Error fetching clinician data:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicianData();
  }, [clinicianId, currentUserId]);

  return { clinicianData, loading, error };
};

export const getClinicianById = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('*')
      .eq('id', clinicianId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching clinician:', error);
    return null;
  }
};

export const getClinicianTimeZone = async (clinicianId: string): Promise<string> => {
  try {
    // Get the time zone from the profiles table using getUserTimeZoneById
    const timeZone = await getUserTimeZoneById(clinicianId);
    console.log(`Retrieved timezone for clinician ${clinicianId}: ${timeZone}`);
    return timeZone;
  } catch (error) {
    console.error('Error fetching clinician timezone:', error);
    return 'America/Chicago'; // Default to Central Time
  }
};
