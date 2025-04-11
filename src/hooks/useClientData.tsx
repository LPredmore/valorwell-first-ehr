
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientData {
  client_first_name?: string;
  client_last_name?: string;
  client_preferred_name?: string;
  client_email?: string;
  client_phone?: string;
  client_date_of_birth?: string;
  client_age?: number;
  client_state?: string;
  client_gender?: string;
}

export const useClientData = (clientId?: string) => {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('clients')
          .select(`
            client_first_name,
            client_last_name,
            client_preferred_name,
            client_email,
            client_phone,
            client_date_of_birth,
            client_age,
            client_state,
            client_gender
          `)
          .eq('id', clientId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setClientData(data);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching client data'));
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  return { clientData, loading, error };
};
