import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { ClientDetails as ClientDetailsType } from '@/packages/core/types/client/details';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft } from 'lucide-react';
import PersonalInfoTab from '@/components/client/PersonalInfoTab';
import InsuranceTab from '@/components/client/InsuranceTab';
import NotesTab from '@/components/client/NotesTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ClientDetails: React.FC = () => {
  const router = useRouter();
  const { clientId } = router.query;
  const [formData, setFormData] = useState<ClientDetailsType>({
    client_first_name: '',
    client_last_name: '',
    client_dob: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_city: '',
    client_state: '',
    client_zip: '',
    client_gender: '',
    client_race: '',
    client_ethnicity: '',
    client_marital_status: '',
    client_occupation: '',
    client_emergency_contact_name: '',
    client_emergency_contact_phone: '',
    client_emergency_contact_relationship: '',
    client_insurance_type: '',
    client_insurance_name: '',
    client_insurance_policy_number: '',
    client_insurance_group_number: '',
    client_notes: '',
    client_diagnosis: [],
    client_is_profile_complete: 'false',
    client_minor: 'false',
    created_at: '',
    updated_at: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      if (clientId) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

          if (error) {
            console.error('Error fetching client data:', error);
          }

          if (data) {
            setFormData(data);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field === 'client_is_profile_complete' || field === 'client_minor') {
      // Convert boolean fields to string
      setFormData(prev => ({
        ...prev,
        [field]: String(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', clientId);

      if (error) {
        console.error('Error updating client data:', error);
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating client data:', error);
    }
  };

  if (loading) {
    return <div>Loading client details...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="ml-2" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PersonalInfoTab
            formData={formData}
            handleInputChange={handleInputChange}
            isEditing={isEditing}
          />
        </TabsContent>
        <TabsContent value="insurance">
          <InsuranceTab
            formData={formData}
            handleInputChange={handleInputChange}
            isEditing={isEditing}
          />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab
            formData={formData}
            handleInputChange={handleInputChange}
            isEditing={isEditing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetails;
