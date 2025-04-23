
import { useQuery, useMutation } from '@tanstack/react-query';
import { getClientDetails, getClientList, updateClientProfile } from '../services/clients';
import { getDefaultQueryOptions, getPaginatedQueryOptions } from '../utils/queryHelpers';

export const useClientDetails = (clientId: string | undefined) => {
  return useQuery({
    ...getDefaultQueryOptions(['client', clientId]),
    queryFn: async () => {
      if (!clientId) return null;
      return getClientDetails(clientId);
    },
    enabled: !!clientId
  });
};

export const useClientList = (page = 1, limit = 10) => {
  return useQuery({
    ...getPaginatedQueryOptions(['clients', page, limit]),
    queryFn: () => getClientList({ page, limit })
  });
};

export const useUpdateClient = () => {
  return useMutation({
    mutationFn: ({ clientId, updates }: { clientId: string; updates: any }) => 
      updateClientProfile(clientId, updates)
  });
};
