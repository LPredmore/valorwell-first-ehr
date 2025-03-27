
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from '@/components/layout/Layout';
import { useClinicianData } from '@/hooks/useClinicianData';

// Import tab components
import ProfileTab from "@/components/client-tabs/ProfileTab";
import DocumentationTab from "@/components/client-tabs/DocumentationTab";
import BillingTab from "@/components/client-tabs/BillingTab";
import SessionsTab from "@/components/client-tabs/SessionsTab";

const ClientDetails: React.FC = () => {
  const { clientId } = useParams();
  const { clinicianData } = useClinicianData();
  
  // Fetch client data using the clientId
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error("Error fetching client data:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clientId,
  });

  return (
    <Layout>
      <div className="space-y-6">
        <Tabs defaultValue="documentation">
          <TabsList className="mb-6 w-full justify-start border-b pb-0 pt-0">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileTab clientData={clientData} />
          </TabsContent>
          
          <TabsContent value="documentation">
            <DocumentationTab clientData={clientData} />
          </TabsContent>
          
          <TabsContent value="billing">
            <BillingTab clientData={clientData} />
          </TabsContent>
          
          <TabsContent value="sessions">
            <SessionsTab clientData={clientData} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClientDetails;
