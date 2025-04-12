
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDocumentAssignments = (clientId: string | null) => {
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocumentAssignments = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('document_assignments')
          .select('*')
          .eq('client_id', clientId)
          .eq('status', 'pending');

        if (error) {
          console.error('Error fetching document assignments:', error);
          throw error;
        }

        if (data) {
          console.log('Pending document assignments:', data);
          setPendingDocuments(data);
        }
      } catch (error) {
        console.error('Error in useDocumentAssignments hook:', error);
        toast({
          title: "Error",
          description: "Failed to fetch document assignments",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentAssignments();
  }, [clientId, toast]);

  return { pendingDocuments, isLoading };
};
