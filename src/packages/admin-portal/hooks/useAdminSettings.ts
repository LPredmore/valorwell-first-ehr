
import { useState } from 'react';
import { supabase } from '@/packages/api/client';
import { toast } from '@/hooks/use-toast';
import { PracticeSettings } from '../types';

export const useAdminSettings = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updatePracticeSettings = async (settings: PracticeSettings) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('practiceinfo')
        .upsert({
          practice_name: settings.practiceName,
          practice_npi: settings.npi,
          practice_taxid: settings.taxId,
          practice_taxonomy: settings.taxonomyCode,
          practice_address1: settings.address1,
          practice_address2: settings.address2,
          practice_city: settings.city,
          practice_state: settings.state,
          practice_zip: settings.zip,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Practice settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating practice settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update practice settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updatePracticeSettings,
  };
};
