
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, parseDateString, formatDateForDB } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from '../components/layout/Layout';

// Import tab components
import PersonalTab from "@/components/client-tabs/PersonalTab";
import InsuranceTab from "@/components/client-tabs/InsuranceTab";
import TreatmentTab from "@/components/client-tabs/TreatmentTab";
import NotesTab from "@/components/client-tabs/NotesTab";

interface ClientDetails {
  id: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_preferred_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_date_of_birth: string | null;
  client_age: number | null;  // This can be a number in the state
  client_gender: string | null;
  client_gender_identity: string | null;
  client_state: string | null;
  client_time_zone: string | null;
  client_minor: string | null;
  client_status: string | null;
  client_assigned_therapist: string | null;
  client_referral_source: string | null;
  client_self_goal: string | null;
  client_diagnosis: string[] | null;
  // Insurance fields
  client_insurance_company_primary: string | null;
  client_policy_number_primary: string | null;
  client_group_number_primary: string | null;
  client_subscriber_name_primary: string | null;
  client_insurance_type_primary: string | null;
  client_subscriber_dob_primary: string | null;
  client_subscriber_relationship_primary: string | null;
  client_insurance_company_secondary: string | null;
  client_policy_number_secondary: string | null;
  client_group_number_secondary: string | null;
  client_subscriber_name_secondary: string | null;
  client_insurance_type_secondary: string | null;
  client_subscriber_dob_secondary: string | null;
  client_subscriber_relationship_secondary: string | null;
  client_insurance_company_tertiary: string | null;
  client_policy_number_tertiary: string | null;
  client_group_number_tertiary: string | null;
  client_subscriber_name_tertiary: string | null;
  client_insurance_type_tertiary: string | null;
  client_subscriber_dob_tertiary: string | null;
  client_subscriber_relationship_tertiary: string | null;
}

interface Clinician {
  id: string;
  clinician_professional_name: string | null;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
}

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();

        if (error) {
          throw error;
        }

        setClientData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError(err as Error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch client details.",
          variant: "destructive",
        });
      }
    };

    const fetchClinicians = async () => {
      try {
        const { data, error } = await supabase
          .from("clinicians")
          .select("*");

        if (error) {
          throw error;
        }

        setClinicians(data);
      } catch (err) {
        console.error('Error fetching clinicians:', err);
        setError(err as Error);
        toast({
          title: "Error",
          description: "Failed to fetch clinicians.",
          variant: "destructive",
        });
      }
    };

    fetchClient();
    fetchClinicians();
  }, [clientId, toast]);

  const formSchema = z.object({
    client_first_name: z.string().min(2).max(50),
    client_last_name: z.string().min(2).max(50),
    client_preferred_name: z.string().optional().nullable(),
    client_email: z.string().email().optional().nullable(),
    client_phone: z.string().optional().nullable(),
    client_date_of_birth: z.date().optional().nullable(),
    client_age: z.string().optional().nullable(),
    client_gender: z.string().optional().nullable(),
    client_gender_identity: z.string().optional().nullable(),
    client_state: z.string().optional().nullable(),
    client_time_zone: z.string().optional().nullable(),
    client_minor: z.string().optional().nullable(),
    client_status: z.string().optional().nullable(),
    client_assigned_therapist: z.string().optional().nullable(),
    client_referral_source: z.string().optional().nullable(),
    client_self_goal: z.string().optional().nullable(),
    client_diagnosis: z.array(z.string()).optional().nullable(),
    // Insurance fields
    client_insurance_company_primary: z.string().optional().nullable(),
    client_policy_number_primary: z.string().optional().nullable(),
    client_group_number_primary: z.string().optional().nullable(),
    client_subscriber_name_primary: z.string().optional().nullable(),
    client_insurance_type_primary: z.string().optional().nullable(),
    client_subscriber_dob_primary: z.date().optional().nullable(),
    client_subscriber_relationship_primary: z.string().optional().nullable(),
    client_insurance_company_secondary: z.string().optional().nullable(),
    client_policy_number_secondary: z.string().optional().nullable(),
    client_group_number_secondary: z.string().optional().nullable(),
    client_subscriber_name_secondary: z.string().optional().nullable(),
    client_insurance_type_secondary: z.string().optional().nullable(),
    client_subscriber_dob_secondary: z.date().optional().nullable(),
    client_subscriber_relationship_secondary: z.string().optional().nullable(),
    client_insurance_company_tertiary: z.string().optional().nullable(),
    client_policy_number_tertiary: z.string().optional().nullable(),
    client_group_number_tertiary: z.string().optional().nullable(),
    client_subscriber_name_tertiary: z.string().optional().nullable(),
    client_insurance_type_tertiary: z.string().optional().nullable(),
    client_subscriber_dob_tertiary: z.date().optional().nullable(),
    client_subscriber_relationship_tertiary: z.string().optional().nullable(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_first_name: clientData?.client_first_name || "",
      client_last_name: clientData?.client_last_name || "",
      client_preferred_name: clientData?.client_preferred_name || "",
      client_email: clientData?.client_email || "",
      client_phone: clientData?.client_phone || "",
      client_date_of_birth: clientData?.client_date_of_birth ? parseDateString(clientData.client_date_of_birth) : null,
      client_age: clientData?.client_age ? String(clientData.client_age) : null,
      client_gender: clientData?.client_gender || "",
      client_gender_identity: clientData?.client_gender_identity || "",
      client_state: clientData?.client_state || "",
      client_time_zone: clientData?.client_time_zone || "",
      client_minor: clientData?.client_minor || "",
      client_status: clientData?.client_status || "",
      client_assigned_therapist: clientData?.client_assigned_therapist || "",
      client_referral_source: clientData?.client_referral_source || "",
      client_self_goal: clientData?.client_self_goal || "",
      client_diagnosis: clientData?.client_diagnosis || [],
      // Insurance fields
      client_insurance_company_primary: clientData?.client_insurance_company_primary || "",
      client_policy_number_primary: clientData?.client_policy_number_primary || "",
      client_group_number_primary: clientData?.client_group_number_primary || "",
      client_subscriber_name_primary: clientData?.client_subscriber_name_primary || "",
      client_insurance_type_primary: clientData?.client_insurance_type_primary || "",
      client_subscriber_dob_primary: clientData?.client_subscriber_dob_primary ? parseDateString(clientData.client_subscriber_dob_primary) : null,
      client_subscriber_relationship_primary: clientData?.client_subscriber_relationship_primary || "",
      client_insurance_company_secondary: clientData?.client_insurance_company_secondary || "",
      client_policy_number_secondary: clientData?.client_policy_number_secondary || "",
      client_group_number_secondary: clientData?.client_group_number_secondary || "",
      client_subscriber_name_secondary: clientData?.client_subscriber_name_secondary || "",
      client_insurance_type_secondary: clientData?.client_insurance_type_secondary || "",
      client_subscriber_dob_secondary: clientData?.client_subscriber_dob_secondary ? parseDateString(clientData.client_subscriber_dob_secondary) : null,
      client_subscriber_relationship_secondary: clientData?.client_subscriber_relationship_secondary || "",
      client_insurance_company_tertiary: clientData?.client_insurance_company_tertiary || "",
      client_policy_number_tertiary: clientData?.client_policy_number_tertiary || "",
      client_group_number_tertiary: clientData?.client_group_number_tertiary || "",
      client_subscriber_name_tertiary: clientData?.client_subscriber_name_tertiary || "",
      client_insurance_type_tertiary: clientData?.client_insurance_type_tertiary || "",
      client_subscriber_dob_tertiary: clientData?.client_subscriber_dob_tertiary ? parseDateString(clientData.client_subscriber_dob_tertiary) : null,
      client_subscriber_relationship_tertiary: clientData?.client_subscriber_relationship_tertiary || "",
    },
  });

  useEffect(() => {
    if (clientData) {
      form.reset({
        client_first_name: clientData.client_first_name || "",
        client_last_name: clientData.client_last_name || "",
        client_preferred_name: clientData.client_preferred_name || "",
        client_email: clientData.client_email || "",
        client_phone: clientData.client_phone || "",
        client_date_of_birth: clientData.client_date_of_birth ? parseDateString(clientData.client_date_of_birth) : null,
        client_age: clientData.client_age ? String(clientData.client_age) : null,
        client_gender: clientData.client_gender || "",
        client_gender_identity: clientData.client_gender_identity || "",
        client_state: clientData.client_state || "",
        client_time_zone: clientData.client_time_zone || "",
        client_minor: clientData.client_minor || "",
        client_status: clientData.client_status || "",
        client_assigned_therapist: clientData.client_assigned_therapist || "",
        client_referral_source: clientData.client_referral_source || "",
        client_self_goal: clientData.client_self_goal || "",
        client_diagnosis: clientData.client_diagnosis || [],
        // Insurance fields
        client_insurance_company_primary: clientData.client_insurance_company_primary || "",
        client_policy_number_primary: clientData.client_policy_number_primary || "",
        client_group_number_primary: clientData.client_group_number_primary || "",
        client_subscriber_name_primary: clientData.client_subscriber_name_primary || "",
        client_insurance_type_primary: clientData.client_insurance_type_primary || "",
        client_subscriber_dob_primary: clientData.client_subscriber_dob_primary ? parseDateString(clientData.client_subscriber_dob_primary) : null,
        client_subscriber_relationship_primary: clientData.client_subscriber_relationship_primary || "",
        client_insurance_company_secondary: clientData.client_insurance_company_secondary || "",
        client_policy_number_secondary: clientData.client_policy_number_secondary || "",
        client_group_number_secondary: clientData.client_group_number_secondary || "",
        client_subscriber_name_secondary: clientData.client_subscriber_name_secondary || "",
        client_insurance_type_secondary: clientData.client_insurance_type_secondary || "",
        client_subscriber_dob_secondary: clientData.client_subscriber_dob_secondary ? parseDateString(clientData.client_subscriber_dob_secondary) : null,
        client_subscriber_relationship_secondary: clientData.client_subscriber_relationship_secondary || "",
        client_insurance_company_tertiary: clientData.client_insurance_company_tertiary || "",
        client_policy_number_tertiary: clientData.client_policy_number_tertiary || "",
        client_group_number_tertiary: clientData.client_group_number_tertiary || "",
        client_subscriber_name_tertiary: clientData.client_subscriber_name_tertiary || "",
        client_insurance_type_tertiary: clientData.client_insurance_type_tertiary || "",
        client_subscriber_dob_tertiary: clientData.client_subscriber_dob_tertiary ? parseDateString(clientData.client_subscriber_dob_tertiary) : null,
        client_subscriber_relationship_tertiary: clientData.client_subscriber_relationship_tertiary || "",
      });
    }
  }, [clientData, form]);

  const handleSaveChanges = async (values: z.infer<typeof formSchema>) => {
    try {
      const formattedValues = {
        ...values,
        client_date_of_birth: values.client_date_of_birth ? formatDateForDB(values.client_date_of_birth) : null,
        client_subscriber_dob_primary: values.client_subscriber_dob_primary ? formatDateForDB(values.client_subscriber_dob_primary) : null,
        client_subscriber_dob_secondary: values.client_subscriber_dob_secondary ? formatDateForDB(values.client_subscriber_dob_secondary) : null,
        client_subscriber_dob_tertiary: values.client_subscriber_dob_tertiary ? formatDateForDB(values.client_subscriber_dob_tertiary) : null,
        client_age: values.client_age ? parseInt(values.client_age) : null,
      };

      const { error } = await supabase
        .from('clients')
        .update(formattedValues)
        .eq('id', clientId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Client details updated successfully."
      });

      setIsEditing(false);

      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (data) {
        setClientData(data);
      }
    } catch (err) {
      console.error('Error updating client:', err);
      toast({
        title: "Error",
        description: "Failed to update client details.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const handleAddDiagnosis = () => {
    const currentDiagnoses = form.getValues("client_diagnosis") || [];
    form.setValue("client_diagnosis", [...currentDiagnoses, ""]);
  };

  const handleRemoveDiagnosis = (index: number) => {
    const currentDiagnoses = form.getValues("client_diagnosis") || [];
    form.setValue(
      "client_diagnosis",
      currentDiagnoses.filter((_, i) => i !== index)
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p>Loading client details...</p>
        </div>
      </Layout>
    );
  }

  if (!clientData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p>Client not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {clientData.client_first_name} {clientData.client_last_name}
          </h1>
          <p className="text-gray-500">{clientData.client_email}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-1">
                <X size={16} /> Cancel
              </Button>
              <Button onClick={form.handleSubmit(handleSaveChanges)} className="flex items-center gap-1 bg-valorwell-700 hover:bg-valorwell-800">
                <Save size={16} /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-1">
              <Pencil size={16} /> Edit
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSaveChanges)}>
        <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalTab form={form} isEditing={isEditing} />
          </TabsContent>

          <TabsContent value="insurance">
            <InsuranceTab form={form} isEditing={isEditing} />
          </TabsContent>

          <TabsContent value="treatment">
            <TreatmentTab 
              form={form} 
              isEditing={isEditing} 
              clinicians={clinicians}
              handleAddDiagnosis={handleAddDiagnosis}
              handleRemoveDiagnosis={handleRemoveDiagnosis}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab />
          </TabsContent>
        </Tabs>
      </form>
    </Layout>
  );
};

export default ClientDetails;
