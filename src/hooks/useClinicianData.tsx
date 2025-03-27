
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicianData {
  id: string;
  created_at: string;
  clinician_professional_name?: string;
  clinician_first_name?: string;
  clinician_last_name?: string;
  clinician_email?: string;
  clinician_phone?: string;
  clinician_credentials?: string;
  clinician_license?: string;
  clinician_npi?: string;
  clinician_status?: string;
  clinician_specialty?: string[];
  clinician_biography?: string;
  [key: string]: any;
}

export const useClinicianData = () => {
  const [clinicianData, setClinicianData] = useState<ClinicianData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClinicianData = async () => {
      try {
        setIsLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch the clinician data
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
        console.error('Error fetching clinician data:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicianData();
  }, []);

  return { clinicianData, isLoading, error };
};
