
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../client';
import { ClientDetails } from '@/packages/core/types/client';
import { handleApiError } from '../utils/error';
import { getDefaultQueryOptions } from '../utils/queryHelpers';

export const useClientDetails = (clientId: string | undefined) => {
  return useQuery({
    ...getDefaultQueryOptions(['client', clientId]),
    queryFn: async () => {
      if (!clientId) return null;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (error) throw error;
        return data as ClientDetails;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled: !!clientId
  });
};

export const useClientList = () => {
  return useQuery({
    ...getDefaultQueryOptions(['clients']),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('client_last_name', { ascending: true });
          
        if (error) throw error;
        return data as ClientDetails[];
      } catch (error) {
        throw handleApiError(error);
      }
    }
  });
};
