
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase, parseDateString, formatDateForDB } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Pencil, Save, X, Plus, Trash, FileText, ClipboardCheck, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Layout from '@/components/layout/Layout';
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import { useClinicianData } from '@/hooks/useClinicianData';

const ClientDetails: React.FC = () => {
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);
  const { clientId } = useParams();
  const { clinicianData, loading: clinicianLoading } = useClinicianData();
  
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

  const handleCloseTreatmentPlan = () => {
    setShowTreatmentPlanTemplate(false);
  };

  const handleCloseSessionNote = () => {
    setShowSessionNoteTemplate(false);
  };

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
          
          <TabsContent value="documentation">
            <div className="grid grid-cols-1 gap-6">
              {/* Charting Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-valorwell-600" />
                    Charting
                  </CardTitle>
                  <CardDescription>View and manage patient charts and progress tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-6">
                    <div className="flex gap-4">
                      <Button onClick={() => setShowTreatmentPlanTemplate(true)}>
                        Create Treatment Plan
                      </Button>
                      <Button onClick={() => setShowSessionNoteTemplate(true)}>
                        Create Session Note
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Conditionally render the templates right after the Charting card */}
              {showTreatmentPlanTemplate && (
                <div className="animate-fade-in">
                  <TreatmentPlanTemplate 
                    onClose={handleCloseTreatmentPlan} 
                    clinicianName={clinicianData?.clinician_professional_name || ''}
                    clientName={`${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`}
                    clientDob={clientData?.client_date_of_birth || ''}
                  />
                </div>
              )}
              
              {showSessionNoteTemplate && (
                <div className="animate-fade-in">
                  <SessionNoteTemplate 
                    onClose={handleCloseSessionNote} 
                    clinicianName={clinicianData?.clinician_professional_name || ''}
                    clientName={`${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`}
                    clientDob={clientData?.client_date_of_birth || ''}
                  />
                </div>
              )}

              {/* Assessments Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-valorwell-600" />
                    Assessments
                  </CardTitle>
                  <CardDescription>View and complete patient assessments</CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  {/* Assessment content */}
                </CardContent>
              </Card>

              {/* Completed Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-valorwell-600" />
                    Completed Notes
                  </CardTitle>
                  <CardDescription>View completed session notes and documentation</CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  {/* Completed notes content */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Other tab contents would go here */}
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClientDetails;
