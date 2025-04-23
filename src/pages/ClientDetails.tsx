import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientDetails as ClientDetailsType } from '@/packages/core/types/client/details';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft } from 'lucide-react';
import PersonalInfoTab from '@/components/client/PersonalInfoTab';
import InsuranceTab from '@/components/client/InsuranceTab';
import NotesTab from '@/components/client/NotesTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ClientDetails: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [formData, setFormData] = useState<ClientDetailsType>({
    id: '',
    created_at: '',
    updated_at: '',
    client_first_name: null,
    client_last_name: null,
    client_preferred_name: null,
    client_date_of_birth: null,
    client_email: null,
    client_phone: null,
    client_gender: null,
    client_gender_identity: null,
    client_address: null,
    client_city: null,
    client_state: null,
    client_zip: null,
    client_country: null,
    client_status: null,
    client_assigned_therapist: null,
    client_time_zone: null,
    client_minor: false,
    client_age: null,
    client_is_profile_complete: false,
    client_relationship: null,
    client_emergency_contact_name: null,
    client_emergency_contact_relationship: null,
    client_emergency_contact_phone: null,
    client_preferred_contact_method: null,
    client_additional_notes: null,
    client_diagnosis: null,
    client_planlength: null,
    client_treatmentfrequency: null,
    client_medications: null,
    client_personsinattendance: null,
    client_referral_source: null,
    client_self_goal: null,
    client_disabilityrating: null,
    client_recentdischarge: null,
    client_branchOS: null,
    client_treatmentplan_startdate: null,
    client_nexttreatmentplanupdate: null,
    client_appearance: null,
    client_attitude: null,
    client_behavior: null,
    client_speech: null,
    client_affect: null,
    client_thoughtprocess: null,
    client_perception: null,
    client_orientation: null,
    client_memoryconcentration: null,
    client_insightjudgement: null,
    client_mood: null,
    client_substanceabuserisk: null,
    client_suicidalideation: null,
    client_homicidalideation: null,
    client_functioning: null,
    client_prognosis: null,
    client_progress: null,
    client_currentsymptoms: null,
    client_sessionnarrative: null,
    client_problem: null,
    client_treatmentgoal: null,
    client_primaryobjective: null,
    client_secondaryobjective: null,
    client_tertiaryobjective: null,
    client_intervention1: null,
    client_intervention2: null,
    client_intervention3: null,
    client_intervention4: null,
    client_intervention5: null,
    client_intervention6: null,
    client_privatenote: null,
    client_temppassword: null
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

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        <Button variant="ghost" onClick={() => navigate(-1)}>
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
            isProfileComplete={formData.client_is_profile_complete}
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
