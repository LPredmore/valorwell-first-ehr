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

interface ClientDetails {
  id: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_preferred_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_date_of_birth: string | null;
  client_age: number | null;
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

  const relationshipOptions = [
    "Self", 
    "Spouse", 
    "Child", 
    "Other"
  ];

  const insuranceTypeOptions = [
    "Commercial", 
    "Medicaid", 
    "Medicare", 
    "TRICARE", 
    "Other"
  ];

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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveChanges)}>
          <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="treatment">Treatment</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_preferred_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_date_of_birth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={!isEditing}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={date =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Non-binary">Non-binary</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_gender_identity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender Identity</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_time_zone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Zone</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_minor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minor</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance">
              <Card>
                <CardHeader>
                  <CardTitle>Primary Insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_insurance_company_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Company</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_insurance_type_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Type</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {insuranceTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_policy_number_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_group_number_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_name_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscriber Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_relationship_primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscriber Relationship</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationshipOptions.map((relation) => (
                                <SelectItem key={relation} value={relation}>
                                  {relation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_dob_primary"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Subscriber Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={!isEditing}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={date =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Secondary Insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_insurance_company_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Company</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_insurance_type_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Type</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {insuranceTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_policy_number_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_group_number_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_name_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscriber Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_relationship_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscriber Relationship</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationshipOptions.map((relation) => (
                                <SelectItem key={relation} value={relation}>
                                  {relation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_dob_secondary"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Subscriber Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={!isEditing}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={date =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Tertiary Insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_insurance_company_tertiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Company</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_insurance_type_tertiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Type</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {insuranceTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_policy_number_tertiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_group_number_tertiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_name_tertiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscriber Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_relationship_tertiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscriber Relationship</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationshipOptions.map((relation) => (
                                <SelectItem key={relation} value={relation}>
                                  {relation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_subscriber_dob_tertiary"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Subscriber Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={!isEditing}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={date =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="treatment">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Diagnosis</CardTitle>
                  <CardDescription>Add client diagnoses here</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.watch("client_diagnosis")?.map((diagnosis, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={diagnosis}
                          onChange={(e) => {
                            const updatedDiagnoses = [...(form.getValues("client_diagnosis") || [])];
                            updatedDiagnoses[index] = e.target.value;
                            form.setValue("client_diagnosis", updatedDiagnoses);
                          }}
                          readOnly={!isEditing}
                          placeholder="Enter diagnosis"
                          className="flex-grow"
                        />
                        {isEditing && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveDiagnosis(index)}
                          >
                            <Trash size={16} className="text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddDiagnosis}
                        className="flex items-center gap-1"
                      >
                        <Plus size={16} /> Add Diagnosis
                      </Button>
                    )}
                    {(!form.watch("client_diagnosis") || form.watch("client_diagnosis")?.length === 0) && !isEditing && (
                      <p className="text-sm text-gray-500">No diagnoses have been added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Treatment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Status</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="On Hold">On Hold</SelectItem>
                              <SelectItem value="Discharged">Discharged</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_assigned_therapist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Therapist</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select therapist" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clinicians.map((clinician) => (
                                <SelectItem key={clinician.id} value={clinician.id}>
                                  {clinician.clinician_professional_name || `${clinician.clinician_first_name} ${clinician.clinician_last_name}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="client_referral_source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Source</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="client_self_goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Self Goal</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                readOnly={!isEditing}
                                className="min-h-[100px]" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentation">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="border-b pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Charting</CardTitle>
                    </div>
                    <CardDescription>
                      View and manage patient charts and progress tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Charts Available</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Charts and progress tracking will be displayed here
                      </p>
                      <Button variant="outline" size="sm">
                        Create New Chart
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Assessments</CardTitle>
                    </div>
                    <CardDescription>
                      View and complete patient assessments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Assessments Available</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Patient assessments will be displayed here
                      </p>
                      <Button variant="outline" size="sm">
                        Create New Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-lg">Completed Notes</CardTitle>
                    </div>
                    <CardDescription>
                      View completed session notes and documentation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Completed Notes</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Completed session notes will be displayed here
                      </p>
                      <Button variant="outline" size="sm">
                        View All Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Internal notes about this client</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">No notes have been added yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </Layout>
  );
};

export default ClientDetails;
