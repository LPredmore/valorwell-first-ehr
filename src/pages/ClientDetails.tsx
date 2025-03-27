
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
import { CalendarIcon, Pencil, Save, X, Plus, Trash, FileText, ClipboardCheck, BarChart2, Phone, Mail, UserRound, Clock } from "lucide-react";
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

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
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
          
          {/* Profile Tab Content */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-valorwell-600" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Client personal information and demographics</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientLoading ? (
                    <div className="py-4 text-center">Loading client information...</div>
                  ) : !clientData ? (
                    <div className="py-4 text-center">No client information found</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">First Name</Label>
                          <p className="font-medium">{clientData.client_first_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Last Name</Label>
                          <p className="font-medium">{clientData.client_last_name || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Preferred Name</Label>
                          <p className="font-medium">{clientData.client_preferred_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                          <p className="font-medium">{formatDate(clientData.client_date_of_birth)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Gender</Label>
                          <p className="font-medium">{clientData.client_gender || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Age</Label>
                          <p className="font-medium">{clientData.client_age || 'Not calculated'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <p className="font-medium">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              clientData.client_status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : clientData.client_status === 'Waiting' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {clientData.client_status || 'Unknown'}
                            </span>
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Profile Completion</Label>
                          <p className="font-medium">{clientData.client_is_profile_complete === 'yes' ? 'Complete' : 'Incomplete'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-valorwell-600" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>Client contact details</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientLoading ? (
                    <div className="py-4 text-center">Loading contact information...</div>
                  ) : !clientData ? (
                    <div className="py-4 text-center">No contact information found</div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Email Address</Label>
                        <p className="font-medium flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {clientData.client_email || 'Not provided'}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone Number</Label>
                        <p className="font-medium flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {clientData.client_phone || 'Not provided'}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">State</Label>
                        <p className="font-medium">{clientData.client_state || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Time Zone</Label>
                        <p className="font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          {clientData.client_time_zone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Insurance Information Card - Full width */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-valorwell-600" />
                    Insurance Information
                  </CardTitle>
                  <CardDescription>Client insurance details</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientLoading ? (
                    <div className="py-4 text-center">Loading insurance information...</div>
                  ) : !clientData ? (
                    <div className="py-4 text-center">No insurance information found</div>
                  ) : !clientData.client_insurance_company_primary ? (
                    <div className="py-4 text-muted-foreground">No insurance information has been provided</div>
                  ) : (
                    <div className="space-y-6">
                      {/* Primary Insurance */}
                      {clientData.client_insurance_company_primary && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Primary Insurance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Insurance Company</Label>
                              <p className="font-medium">{clientData.client_insurance_company_primary}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Insurance Type</Label>
                              <p className="font-medium">{clientData.client_insurance_type_primary || 'Not specified'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Policy Number</Label>
                              <p className="font-medium">{clientData.client_policy_number_primary || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Group Number</Label>
                              <p className="font-medium">{clientData.client_group_number_primary || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Subscriber Name</Label>
                              <p className="font-medium">{clientData.client_subscriber_name_primary || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Relationship to Subscriber</Label>
                              <p className="font-medium">{clientData.client_subscriber_relationship_primary || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Secondary Insurance - Only show if exists */}
                      {clientData.client_insurance_company_secondary && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Secondary Insurance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Insurance Company</Label>
                              <p className="font-medium">{clientData.client_insurance_company_secondary}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Insurance Type</Label>
                              <p className="font-medium">{clientData.client_insurance_type_secondary || 'Not specified'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Policy Number</Label>
                              <p className="font-medium">{clientData.client_policy_number_secondary || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
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
          
          {/* Billing Tab Content */}
          <TabsContent value="billing">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                  <CardDescription>Manage client billing and insurance claims</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-4 text-muted-foreground">Billing functionality coming soon</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Sessions Tab Content */}
          <TabsContent value="sessions">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                  <CardDescription>View and manage client sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-4 text-muted-foreground">Sessions functionality coming soon</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClientDetails;
