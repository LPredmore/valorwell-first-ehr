
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useClinicianData = () => {
  const [clinicianData, setClinicianData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClinicianData = async () => {
      try {
        setLoading(true);
        
        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Query the clinicians table to find the record matching the user's ID
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setClinicianData(data);
      } catch (err) {
        console.error("Error fetching clinician data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchClinicianData();
  }, []);

  return { clinicianData, loading, error };
};
