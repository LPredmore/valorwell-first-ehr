
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserTimeZone = (clinicianId: string | null | undefined) => {
  const [timeZone, setTimeZone] = useState<string>("America/Chicago");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTimeZone = async () => {
      if (!clinicianId) {
        setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clinicians')
          .select('clinician_time_zone')
          .eq('id', clinicianId)
          .single();

        if (error) throw error;

        if (data && data.clinician_time_zone) {
          setTimeZone(data.clinician_time_zone);
        } else {
          setTimeZone("America/Chicago"); // Default to Central Time if not found
        }
      } catch (err) {
        console.error("Error fetching clinician's timezone:", err);
        setError(err as Error);
        setTimeZone("America/Chicago"); // Fall back to Central Time
      } finally {
        setLoading(false);
      }
    };

    fetchTimeZone();
  }, [clinicianId]);

  return { timeZone, loading, error };
};

export const getUserTimeZoneById = async (userId: string | null | undefined): Promise<string> => {
  if (!userId) return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('clinician_time_zone')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    
    if (data && data.clinician_time_zone) {
      return data.clinician_time_zone;
    } else {
      // If clinician not found, try to get from clients table
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_time_zone')
        .eq('id', userId)
        .maybeSingle();

      if (clientError) throw clientError;
      
      if (clientData && clientData.client_time_zone) {
        return clientData.client_time_zone;
      }
    }
    
    return "America/Chicago"; // Default to Central Time if no timezone found
  } catch (err) {
    console.error("Error getting user timezone:", err);
    return "America/Chicago"; // Fall back to Central Time
  }
};
