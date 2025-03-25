import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  client_treatment_goal: string | null;
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
  const toast = useToast();

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId);

        if (error) {
          throw error;
        }

        setClientData(data[0]);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
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
        setError(err as Error);
      }
    };

    fetchClient();
    fetchClinicians();
  }, [clientId]);

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
    client_treatment_goal: z.string().optional().nullable(),
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
      client_date_of_birth: clientData?.client_date_of_birth || null,
      client_age: clientData?.client_age || null,
      client_gender: clientData?.client_gender || "",
      client_gender_identity: clientData?.client_gender_identity || "",
      client_state: clientData?.client_state || "",
      client_time_zone: clientData?.client_time_zone || "",
      client_minor: clientData?.client_minor || "",
      client_status: clientData?.client_status || "",
      client_assigned

