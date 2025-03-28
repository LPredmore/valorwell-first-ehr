
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ICD10Code {
  id: number;
  icd10: string;
  diagnosis_name: string;
}

export function useICD10Codes(searchTerm: string = '') {
  const [codes, setCodes] = useState<ICD10Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCodes = async () => {
      if (!searchTerm) {
        setCodes([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('icd10')
          .select('*')
          .ilike('diagnosis_name', `%${searchTerm}%`)
          .limit(50);
        
        if (error) throw error;
        setCodes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error fetching ICD10 codes:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCodes();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return { codes, loading, error };
}
