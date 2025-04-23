
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientDetails } from '@/packages/core/types/client';

export const useClientData = (clientId?: string) => {
  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) {
          setError(error);
        } else {
          setClientData(data);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  return { clientData, isLoading, error };
};
