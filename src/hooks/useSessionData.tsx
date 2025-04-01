
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientDetails } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

interface SessionDataState {
  isLoading: boolean;
  error: string | null;
  clientData: ClientDetails | null;
  phq9Narrative: string;
  sessionTypes: Array<{ code: string; name: string }>;
  hasExistingDiagnosis: boolean;
  diagnosisCodes: string[];
}

interface UseSessionDataProps {
  clientId: string | null;
  appointmentId?: string | null;
  appointmentDate?: string;
}

export const useSessionData = ({ clientId, appointmentId, appointmentDate }: UseSessionDataProps) => {
  const { toast } = useToast();
  const [state, setState] = useState<SessionDataState>({
    isLoading: true,
    error: null,
    clientData: null,
    phq9Narrative: '',
    sessionTypes: [],
    hasExistingDiagnosis: false,
    diagnosisCodes: []
  });

  // Function to save session note history
  const saveSessionHistory = async (sessionData: any) => {
    if (!clientId || !state.clientData) {
      console.error('Cannot save session history: missing client data');
      return { success: false, error: 'Missing client data' };
    }

    try {
      const historyData = {
        client_id: clientId,
        appointment_id: appointmentId || null,
        session_date: appointmentDate || new Date().toISOString().split('T')[0],
        session_type: sessionData.sessionType || 'Therapy Session',
        session_data: sessionData
      };

      const { data, error } = await supabase
        .from('session_notes_history')
        .insert([historyData])
        .select()
        .single();

      if (error) {
        console.error('Error saving session history:', error);
        return { success: false, error };
      }

      console.log('Session history saved successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Exception in saveSessionHistory:', error);
      return { success: false, error };
    }
  };

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;

      setState(prev => ({ ...prev, isLoading: true }));
      try {
        console.log('Fetching client data for ID:', clientId);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (error) {
          console.error('Error fetching client data:', error);
          setState(prev => ({ 
            ...prev, 
            error: `Failed to load client data: ${error.message}`,
            isLoading: false 
          }));
          return;
        }
        
        // Check for existing diagnosis
        const existingDiagnosis = data.client_diagnosis && data.client_diagnosis.length > 0;
        
        setState(prev => ({
          ...prev,
          clientData: data as ClientDetails,
          hasExistingDiagnosis: existingDiagnosis,
          diagnosisCodes: existingDiagnosis ? data.client_diagnosis : [],
          isLoading: false
        }));
        
        console.log('Client data loaded successfully:', data);
      } catch (error) {
        console.error('Exception in fetchClientData:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'An unexpected error occurred while loading client data',
          isLoading: false 
        }));
      }
    };

    fetchClientData();
  }, [clientId]);

  // Fetch session types
  useEffect(() => {
    const fetchSessionTypes = async () => {
      try {
        console.log("Fetching CPT codes for session types");
        const { data, error } = await supabase
          .from('cpt_codes')
          .select('code, name')
          .eq('status', 'Active');
          
        if (error) {
          console.error('Error fetching CPT codes:', error);
          return;
        }
        
        console.log("Fetched session types:", data);
        setState(prev => ({
          ...prev,
          sessionTypes: data || []
        }));
      } catch (error) {
        console.error('Error in fetchSessionTypes:', error);
      }
    };
    
    fetchSessionTypes();
  }, []);

  // Fetch latest PHQ9 assessment
  useEffect(() => {
    const fetchLatestPHQ9 = async () => {
      if (!clientId) return;
      
      try {
        console.log("Fetching latest PHQ9 assessment for client:", clientId);
        const { data, error } = await supabase
          .from('phq9_assessments')
          .select('phq9_narrative')
          .eq('client_id', clientId)
          .order('assessment_date', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('Error fetching PHQ-9 assessment:', error);
          return;
        }
        
        console.log("Fetched PHQ9 narrative:", data);
        if (data && data.length > 0 && data[0].phq9_narrative) {
          setState(prev => ({
            ...prev,
            phq9Narrative: data[0].phq9_narrative
          }));
        }
      } catch (error) {
        console.error('Error in fetchLatestPHQ9:', error);
      }
    };
    
    fetchLatestPHQ9();
  }, [clientId]);

  // Display toast for errors
  useEffect(() => {
    if (state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive"
      });
    }
  }, [state.error, toast]);

  return {
    ...state,
    saveSessionHistory
  };
};
