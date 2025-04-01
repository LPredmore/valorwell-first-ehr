
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientDetails } from '@/types/client';

export const useClientData = (clientId: string | null) => {
  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
        
        if (error) {
          console.error('Error fetching client data:', error);
          toast({
            title: "Error",
            description: "Could not load client data. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        setClientData(data as ClientDetails);
      } catch (error) {
        console.error('Error in fetchClientData:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading client data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (clientId) {
      fetchClientData();
    }
  }, [clientId, toast]);

  return { clientData, isLoading };
};
