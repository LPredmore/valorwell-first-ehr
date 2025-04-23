
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useClientProfile = (clientId: string | null) => {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  
  const fetchClientProfile = async () => {
    if (!clientId) {
      setLoading(false);
      return null;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
        
      if (error) throw error;
      setClientData(data);
      return data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    clientData,
    fetchClientProfile
  };
};
