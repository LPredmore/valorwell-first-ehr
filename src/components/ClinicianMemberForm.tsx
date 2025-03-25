
import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface ClinicianMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId?: string | null;
}

const ClinicianMemberForm = ({ isOpen, onClose, clinicianId }: ClinicianMemberFormProps) => {
  const [formData, setFormData] = useState({
    clinician_first_name: '',
    clinician_last_name: '',
    clinician_email: '',
    clinician_professional_name: '',
    clinician_phone: '',
    clinician_state: '',
    clinician_license_type: '',
    clinician_npi_number: '',
    clinician_taxonomy_code: '',
    clinician_accepting_new_clients: 'Yes',
    clinician_bio: '',
    clinician_min_client_age: 18,
    clinician_treatment_approaches: []
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen && clinicianId) {
      fetchClinicianData();
    } else if (isOpen && !clinicianId) {
      // Reset form for new clinician
      setFormData({
        clinician_first_name: '',
        clinician_last_name: '',
        clinician_email: '',
        clinician_professional_name: '',
        clinician_phone: '',
        clinician_state: '',
        clinician_license_type: '',
        clinician_npi_number: '',
        clinician_taxonomy_code: '',
        clinician_accepting_new_clients: 'Yes',
        clinician_bio: '',
        clinician_min_client_age: 18,
        clinician_treatment_approaches: []
      });
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
        setFormData({
          clinician_first_name: data.clinician_first_name || '',
          clinician_last_name: data.clinician_last_name || '',
          clinician_email: data.clinician_email || '',
          clinician_professional_name: data.clinician_professional_name || '',
          clinician_phone: data.clinician_phone || '',
          clinician_state: data.clinician_state || '',
          clinician_license_type: data.clinician_license_type || '',
          clinician_npi_number: data.clinician_npi_number || '',
          clinician_taxonomy_code: data.clinician_taxonomy_code || '',
          clinician_accepting_new_clients: data.clinician_accepting_new_clients || 'Yes',
          clinician_bio: data.clinician_bio || '',
          clinician_min_client_age: data.clinician_min_client_age || 18,
          clinician_treatment_approaches: data.clinician_treatment_approaches || []
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
      
      if (clinicianId) {
        // Update existing clinician
        const { error } = await supabase
          .from('clinicians')
          .update({
            clinician_first_name: formData.clinician_first_name,
            clinician_last_name: formData.clinician_last_name,
            clinician_email: formData.clinician_email,
            clinician_professional_name: formData.clinician_professional_name,
            clinician_phone: formData.clinician_phone,
            clinician_state: formData.clinician_state,
            clinician_license_type: formData.clinician_license_type,
            clinician_npi_number: formData.clinician_npi_number,
            clinician_taxonomy_code: formData.clinician_taxonomy_code,
            clinician_accepting_new_clients: formData.clinician_accepting_new_clients,
            clinician_bio: formData.clinician_bio,
            clinician_min_client_age: formData.clinician_min_client_age,
            clinician_treatment_approaches: formData.clinician_treatment_approaches
          })
          .eq('id', clinicianId);
          
        if (error) throw error;
        
        toast.success('Clinician updated successfully');
      } else {
        // Create new clinician with a UUID
        const newClinicianId = uuidv4();
        const { error } = await supabase
          .from('clinicians')
          .insert({
            id: newClinicianId, // Add the required id field
            clinician_first_name: formData.clinician_first_name,
            clinician_last_name: formData.clinician_last_name,
            clinician_email: formData.clinician_email,
            clinician_professional_name: formData.clinician_professional_name,
            clinician_phone: formData.clinician_phone,
            clinician_state: formData.clinician_state,
            clinician_license_type: formData.clinician_license_type,
            clinician_npi_number: formData.clinician_npi_number,
            clinician_taxonomy_code: formData.clinician_taxonomy_code,
            clinician_accepting_new_clients: formData.clinician_accepting_new_clients,
            clinician_bio: formData.clinician_bio,
            clinician_min_client_age: formData.clinician_min_client_age,
            clinician_treatment_approaches: formData.clinician_treatment_approaches
          });
          
        if (error) throw error;
        
        toast.success('Clinician created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving clinician:', error);
      toast.error('Failed to save clinician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Clinician Member Functionality Removed</SheetTitle>
        </SheetHeader>
        
        <div className="flex items-center justify-center h-64">
          <p className="text-center text-gray-600">
            Clinician member creation and editing functionality has been removed.
          </p>
        </div>
        
        <SheetFooter>
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ClinicianMemberForm;
