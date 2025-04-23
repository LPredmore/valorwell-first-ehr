
/**
 * Client API functions
 * 
 * This module contains functions for interacting with client data in Supabase.
 */

import { supabase } from '@/integrations/supabase/client';
import { ClientDetails } from '@/packages/core/types/client';

/**
 * Fetch client details by ID
 * @param clientId The ID of the client to fetch
 * @returns The client details or null if not found
 */
export const fetchClientById = async (clientId: string): Promise<ClientDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }
    
    return data as ClientDetails;
  } catch (error) {
    console.error('Exception fetching client:', error);
    return null;
  }
};

/**
 * Fetch all clients
 * @returns An array of client details
 */
export const fetchAllClients = async (): Promise<ClientDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_last_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    
    return data as ClientDetails[];
  } catch (error) {
    console.error('Exception fetching clients:', error);
    return [];
  }
};

/**
 * Update client details
 * @param clientId The ID of the client to update
 * @param updates The updates to apply
 * @returns True if the update was successful, false otherwise
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
    
    if (error) {
      console.error('Error updating client:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating client:', error);
    return false;
  }
};
