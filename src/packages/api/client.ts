
/**
 * Client API functions
 * 
 * This module contains functions for interacting with client data in Supabase.
 */

import { supabase } from '@/integrations/supabase/client';
import { ClientDetails } from '@/packages/core/types/client';
import { handleApiError } from './utils/error';

/**
 * Fetch client details by ID
 */
export const fetchClientById = async (clientId: string): Promise<ClientDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();
    
    if (error) throw error;
    return data as ClientDetails;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update client details
 */
export const updateClient = async (
  clientId: string, 
  updates: Partial<ClientDetails>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    throw handleApiError(error);
  }
};
