
import { useState } from 'react';
import { supabase } from '@/packages/api/client';
import { useToast } from '@/components/ui/use-toast';
import { ClientDetails } from '@/packages/core/types/client';

export const useClientProfile = (clientId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const updateProfile = async (updates: Partial<ClientDetails>) => {
    if (!clientId) return { success: false, error: 'No client ID provided' };
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    updateProfile
  };
};
