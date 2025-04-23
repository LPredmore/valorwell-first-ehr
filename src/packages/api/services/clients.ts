
import { supabase } from '../client';
import { handleApiError } from '../utils/error';
import { ClientDetails } from '@/packages/core/types/client';
import { PaginationRequest } from '../types/requests';

export const getClientDetails = async (clientId: string) => {
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
};

export const getClientList = async ({ page = 1, limit = 10 }: PaginationRequest) => {
  try {
    const { data, error, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit);
      
    if (error) throw error;
    return { 
      data: data as ClientDetails[], 
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateClientProfile = async (clientId: string, updates: Partial<ClientDetails>) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();
      
    if (error) throw error;
    return data as ClientDetails;
  } catch (error) {
    throw handleApiError(error);
  }
};
