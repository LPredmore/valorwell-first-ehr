
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ClinicianProfileEditProps = {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
};

const ClinicianProfileEdit = ({ isOpen, onClose, clinicianId }: ClinicianProfileEditProps) => {
  const [clinicianData, setClinicianData] = useState({
    clinician_first_name: '',
    clinician_last_name: '',
    clinician_professional_name: '',
    clinician_email: '',
    clinician_phone: '',
    clinician_state: '',
    clinician_bio: '',
    clinician_npi_number: '',
    clinician_taxonomy_code: '',
    clinician_license_type: '',
    clinician_image_url: '',
    clinician_accepting_new_clients: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen && clinicianId) {
      fetchClinicianData();
    }
  }, [isOpen, clinicianId]);
  
  const fetchClinicianData = async () => {
    if (!clinicianId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinicians')
        .select('*')
        .eq('id', clinicianId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setClinicianData({
          clinician_first_name: data.clinician_first_name || '',
          clinician_last_name: data.clinician_last_name || '',
          clinician_professional_name: data.clinician_professional_name || '',
          clinician_email: data.clinician_email || '',
          clinician_phone: data.clinician_phone || '',
          clinician_state: data.clinician_state || '',
          clinician_bio: data.clinician_bio || '',
          clinician_npi_number: data.clinician_npi_number || '',
          clinician_taxonomy_code: data.clinician_taxonomy_code || '',
          clinician_license_type: data.clinician_license_type || '',
          clinician_image_url: data.clinician_image_url || '',
          clinician_accepting_new_clients: data.clinician_accepting_new_clients || ''
        });
      }
    } catch (error) {
      console.error('Error fetching clinician:', error);
      toast.error('Failed to load clinician data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('clinicians')
        .update({
          clinician_first_name: clinicianData.clinician_first_name,
          clinician_last_name: clinicianData.clinician_last_name,
          clinician_professional_name: clinicianData.clinician_professional_name,
          clinician_email: clinicianData.clinician_email,
          clinician_phone: clinicianData.clinician_phone,
          clinician_state: clinicianData.clinician_state,
          clinician_bio: clinicianData.clinician_bio, 
          clinician_npi_number: clinicianData.clinician_npi_number,
          clinician_taxonomy_code: clinicianData.clinician_taxonomy_code,
          clinician_license_type: clinicianData.clinician_license_type,
          clinician_image_url: clinicianData.clinician_image_url,
          clinician_accepting_new_clients: clinicianData.clinician_accepting_new_clients
        })
        .eq('id', clinicianId);
        
      if (error) throw error;
      
      toast.success('Clinician updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating clinician:', error);
      toast.error('Failed to update clinician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Clinician Profile Functionality Removed</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-center text-gray-600">
            Clinician profile creation and editing functionality has been removed.
          </p>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicianProfileEdit;
