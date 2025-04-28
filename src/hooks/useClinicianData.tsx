import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clinician } from "@/types/client";
import { getUserTimeZoneById } from "./useUserTimeZone";
import { useUser } from "@/context/UserContext";
import { ensureClinicianID } from "@/utils/validation/clinicianUtils";

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
        let targetId = clinicianId || currentUserId;
        
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
        
        // Ensure valid clinician ID format
        try {
          targetId = ensureClinicianID(targetId);
        } catch (err) {
          console.warn('[useClinicianData] ID format warning:', err);
          // Continue with original ID if validation fails
        }
        
        console.log(`[useClinicianData] Fetching clinician data for ID: ${targetId}`);
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', targetId)
          .single();

        if (error) {
          // If the specific ID fails, try looking up by normalized ID
          console.warn('[useClinicianData] Error with direct ID match:', error);
          
          // Try to find by matching IDs with different formats
          console.log('[useClinicianData] Attempting to find clinician by alternate ID formats');
          
          const normalizedTargetId = targetId.toLowerCase().replace(/-/g, '');
          const { data: allClinicians, error: listError } = await supabase
            .from('clinicians')
            .select('id, clinician_email, clinician_first_name, clinician_last_name');
            
          if (!listError && allClinicians) {
            // Find a clinician with a matching normalized ID
            const matchingClinician = allClinicians.find(clinician => 
              clinician.id.toLowerCase().replace(/-/g, '') === normalizedTargetId
            );
            
            if (matchingClinician) {
              console.log('[useClinicianData] Found matching clinician by normalized ID:', matchingClinician);
              
              // Now fetch the full clinician data
              const { data: fullData } = await supabase
                .from('clinicians')
                .select('*')
                .eq('id', matchingClinician.id)
                .single();
                
              if (fullData) {
                setClinicianData(fullData);
                return;
              }
            }
          }
          
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
    // Ensure valid format
    let targetId;
    try {
      targetId = ensureClinicianID(clinicianId);
    } catch (err) {
      console.warn('[getClinicianById] ID format warning:', err);
      targetId = clinicianId; // Use original if validation fails
    }
    
    console.log(`[getClinicianById] Looking up clinician with ID: ${targetId}`);
    
    const { data, error } = await supabase
      .from('clinicians')
      .select('*')
      .eq('id', targetId)
      .single();
      
    if (error) {
      // Try looking up by normalized ID
      console.warn('[getClinicianById] Direct lookup failed, trying normalized ID lookup');
      
      const normalizedId = clinicianId.toLowerCase().replace(/-/g, '');
      const { data: allClinicians } = await supabase
        .from('clinicians')
        .select('id');
        
      const matchingId = allClinicians?.find(c => 
        c.id.toLowerCase().replace(/-/g, '') === normalizedId
      )?.id;
      
      if (matchingId) {
        console.log(`[getClinicianById] Found matching ID format: ${matchingId}`);
        const { data: matchData } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', matchingId)
          .single();
          
        return matchData;
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching clinician:', error);
    return null;
  }
};

export const getClinicianTimeZone = async (clinicianId: string): Promise<string> => {
  try {
    console.log(`[getClinicianTimeZone] Getting timezone for clinician ${clinicianId}`);
    
    // Get the time zone from the profiles table using getUserTimeZoneById
    const timeZone = await getUserTimeZoneById(clinicianId);
    console.log(`Retrieved timezone for clinician ${clinicianId}: ${timeZone}`);
    return timeZone;
  } catch (error) {
    console.error('Error fetching clinician timezone:', error);
    return 'America/Chicago'; // Default to Central Time
  }
};
