
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserTimeZoneById } from "./useUserTimeZone";

// Update the Clinician type to match the database schema
export interface Clinician {
  id: string;
  clinician_first_name?: string;
  clinician_last_name?: string;
  clinician_email?: string;
  clinician_phone?: string;
  clinician_professional_name?: string;
  clinician_time_zone?: string;
  clinician_status?: string;
}

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
    // Get the time zone directly from the clinicians table
    const timeZone = await getUserTimeZoneById(clinicianId);
    console.log(`Retrieved timezone for clinician ${clinicianId}: ${timeZone}`);
    return timeZone;
  } catch (error) {
    console.error('Error fetching clinician timezone:', error);
    return 'America/Chicago'; // Default to Central Time
  }
};
