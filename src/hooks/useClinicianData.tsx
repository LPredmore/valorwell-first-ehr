import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clinician } from "@/types/client";
import { getUserTimeZoneById } from "./useUserTimeZone";

export const useClinicianData = () => {
  const [clinicianData, setClinicianData] = useState<Clinician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClinicianData = async () => {
      try {
        setLoading(true);
        
        // Get the first clinician for now (in a real app, you would get the current user's clinician)
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .limit(1)
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
  }, []);

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
    // First try to get the time zone from the profiles table (new approach)
    return await getUserTimeZoneById(clinicianId);
    
    // Note: We no longer need the fallback to the clinicians table since
    // we've migrated all time zone data to the profiles table
  } catch (error) {
    console.error('Error fetching clinician timezone:', error);
    return 'America/Chicago'; // Default to Central Time
  }
};
