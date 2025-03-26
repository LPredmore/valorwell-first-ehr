
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TreatmentPlanTemplate from '../templates/TreatmentPlanTemplate';
import { supabase } from '@/integrations/supabase/client';

interface TreatmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const TreatmentPlanModal: React.FC<TreatmentPlanModalProps> = ({ 
  isOpen, 
  onClose, 
  clientId 
}) => {
  const [clientData, setClientData] = useState<any>(null);
  const [clinicianData, setClinicianData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchData();
    }
  }, [isOpen, clientId]);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientError) throw clientError;
      setClientData(clientData);
      
      // Get the current user (clinician)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Fetch clinician data
      if (user) {
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (clinicianError) throw clinicianError;
        setClinicianData(clinicianData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p>Loading treatment plan data...</p>
          </div>
        ) : (
          <TreatmentPlanTemplate 
            onClose={onClose} 
            clientData={clientData}
            clinicianData={clinicianData}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentPlanModal;
