
import { useState, useEffect } from 'react';
import { supabase } from '@/packages/api/client';
import { ClientDetails } from '../types/client';

export const useClientData = (userId?: string) => {
  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userId)
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
  }, [userId]);

  return { clientData, isLoading, error };
};
