
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
        
        // Calculate age from date of birth
        if (data) {
          const clientWithCalculatedAge = {
            ...data,
            client_age: calculateAge(data.client_date_of_birth)
          } as ClientDetails;
          
          setClientData(clientWithCalculatedAge);
        }
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

  // Function to calculate age based on date of birth
  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      
      // Check for invalid date
      if (isNaN(dob.getTime())) {
        console.error('Invalid date of birth:', dateOfBirth);
        return null;
      }
      
      // Calculate age based on year difference
      let age = today.getFullYear() - dob.getFullYear();
      
      // Adjust age if birthday hasn't occurred yet this year
      const hasBirthdayOccurredThisYear = 
        today.getMonth() > dob.getMonth() || 
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
        
      if (!hasBirthdayOccurredThisYear) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  return { clientData, isLoading };
};
