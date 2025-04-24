
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const usePHQ9Data = (clientId?: string, assessmentDate?: string) => {
  const [phq9Data, setPhq9Data] = useState<any>(null);

  useEffect(() => {
    const fetchPHQ9Assessment = async () => {
      if (!clientId || !assessmentDate) return;

      const { data, error } = await supabase
        .from('phq9_assessments')
        .select('*')
        .eq('client_id', clientId)
        .eq('assessment_date', assessmentDate)
        .maybeSingle();

      if (error) {
        console.error('Error fetching PHQ-9 assessment:', error);
        return;
      }

      setPhq9Data(data);
    };

    fetchPHQ9Assessment();
  }, [clientId, assessmentDate]);

  return { phq9Data };
};
