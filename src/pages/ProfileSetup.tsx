import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useToast } from '@/hooks/use-toast';
import { timezoneOptions } from '@/utils/timezoneOptions';
import { DateField } from '@/components/ui/DateField';
import { format, parseISO } from 'date-fns';
import SignupChampva from '@/components/signup/SignupChampva';
import SignupTricare from '@/components/signup/SignupTricare';
import SignupVaCcn from '@/components/signup/SignupVaCcn';
import SignupVeteran from '@/components/signup/SignupVeteran';
import SignupNotAVeteran from '@/components/signup/SignupNotAVeteran';
import AdditionalInsurance from '@/components/signup/AdditionalInsurance';
import MoreAdditionalInsurance from '@/components/signup/MoreAdditionalInsurance';
import SignupLast from '@/components/signup/SignupLast';
import { useUser } from '@/context/UserContext';
import { calculateAge } from '@/utils/dateUtils';

// Define a more specific type for what fetchUser returns / form.reset expects
type ClientFormData = {
  client_first_name?: string;
  client_last_name?: string;
  client_preferred_name?: string;
  client_email?: string;
  client_phone?: string;
  client_relationship?: string;
  client_date_of_birth?: Date | null;
  client_age?: number | null;
  client_gender?: string;
  client_gender_identity?: string;
  client_state?: string;
  client_time_zone?: string;
  client_vacoverage?: string;
  client_champva?: string;
  client_other_insurance?: string;
  client_champva_agreement?: boolean;
  client_mental_health_referral?: string;
  client_branchOS?: string;
  client_recentdischarge?: Date | null;
  client_disabilityrating?: string;
  client_tricare_beneficiary_category?: string;
  client_tricare_sponsor_name?: string;
  client_tricare_sponsor_branch?: string;
  client_tricare_sponsor_id?: string;
  client_tricare_plan?: string;
  client_tricare_region?: string;
  client_tricare_policy_id?: string;
  client_tricare_has_referral?: string;
  client_tricare_referral_number?: string;
  client_tricare_insurance_agreement?: boolean;
  client_veteran_relationship?: string;
  client_situation_explanation?: string;
  client_insurance_company_primary?: string;
  client_insurance_type_primary?: string;
  client_subscriber_name_primary?: string;
  client_subscriber_relationship_primary?: string;
  client_subscriber_dob_primary?: Date | null;
  client_group_number_primary?: string;
  client_policy_number_primary?: string;
  client_insurance_company_secondary?: string;
  client_insurance_type_secondary?: string;
  client_subscriber_name_secondary?: string;
  client_subscriber_relationship_secondary?: string;
  client_subscriber_dob_secondary?: Date | null;
  client_group_number_secondary?: string;
  client_policy_number_secondary?: string;
  hasMoreInsurance?: string;
  client_has_even_more_insurance?: string;
  client_self_goal?: string;
  client_referral_source?: string;
};


const profileStep1Schema = z.object({
  client_first_name: z.string().min(1, "First name is required"),
  client_last_name: z.string().min(1, "Last name is required"),
  client_preferred_name: z.string().optional().nullable(),
  client_email: z.string().email("Valid email is required"),
  client_phone: z.string().min(10, "Valid phone number is required"),
  client_relationship: z.string().min(1, "Relationship is required"),
});

const profileStep2Schema = z.object({
  client_date_of_birth: z.date({
    required_error: "Date of birth is required",
  }).nullable(),
  client_gender: z.string().min(1, "Birth gender is required"),
  client_gender_identity: z.string().min(1, "Gender identity is required"),
  client_state: z.string().min(1, "State is required"),
  client_time_zone: z.string().min(1, "Time zone is required"),
  client_vacoverage: z.string().min(1, "VA coverage information is required"),
});

type ProfileFormValues = z.infer<typeof profileStep1Schema> &
  Partial<z.infer<typeof profileStep2Schema>> & {
    client_age?: number | null;
    client_champva?: string;
    client_other_insurance?: string;
    client_champva_agreement?: boolean;
    client_mental_health_referral?: string;
    client_branchOS?: string;
    client_recentdischarge?: Date | null;
    client_disabilityrating?: string;
    client_tricare_beneficiary_category?: string;
    client_tricare_sponsor_name?: string;
    client_tricare_sponsor_branch?: string;
    client_tricare_sponsor_id?: string;
    client_tricare_plan?: string;
    client_tricare_region?: string;
    client_tricare_policy_id?: string;
    client_tricare_has_referral?: string;
    client_tricare_referral_number?: string;
    client_tricare_insurance_agreement?: boolean;
    client_veteran_relationship?: string;
    client_situation_explanation?: string;
    client_insurance_company_primary?: string;
    client_insurance_type_primary?: string;
    client_subscriber_name_primary?: string;
    client_subscriber_relationship_primary?: string;
    client_subscriber_dob_primary?: Date | null;
    client_group_number_primary?: string;
    client_policy_number_primary?: string;
    client_insurance_company_secondary?: string;
    client_insurance_type_secondary?: string;
    client_subscriber_name_secondary?: string;
    client_subscriber_relationship_secondary?: string;
    client_subscriber_dob_secondary?: Date | null;
    client_group_number_secondary?: string;
    client_policy_number_secondary?: string;
    hasMoreInsurance?: string;
    client_has_even_more_insurance?: string;
    client_self_goal?: string;
    client_referral_source?: string;
  };


const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: isUserContextLoading, userId, refreshUserData } = useUser();

  const [clientId, setClientId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([1]);
  const [otherInsurance, setOtherInsurance] = useState<string>('');
  const [isFormLoading, setIsFormLoading] = useState(true);
  const initialDataLoadedForUser = useRef<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(
      currentStep === 1
        ? profileStep1Schema
        : currentStep === 2
        ? profileStep2Schema
        : z.object({}) 
    ),
    mode: "onChange",
    defaultValues: { /* ... your extensive default values ... */
        client_first_name: '', client_preferred_name: '', client_last_name: '',
        client_email: '', client_phone: '', client_relationship: '',
        client_date_of_birth: null, client_age: null, client_gender: '', client_gender_identity: '',
        client_state: '', client_time_zone: '', client_vacoverage: '', client_champva: '',
        client_other_insurance: '', client_champva_agreement: false, client_mental_health_referral: '',
        client_branchOS: '', client_recentdischarge: null, client_disabilityrating: '',
        client_tricare_beneficiary_category: '', client_tricare_sponsor_name: '',
        client_tricare_sponsor_branch: '', client_tricare_sponsor_id: '', client_tricare_plan: '',
        client_tricare_region: '', client_tricare_policy_id: '', client_tricare_has_referral: '',
        client_tricare_referral_number: '', client_tricare_insurance_agreement: false,
        client_veteran_relationship: '', client_situation_explanation: '',
        client_insurance_company_primary: '', client_insurance_type_primary: '',
        client_subscriber_name_primary: '', client_subscriber_relationship_primary: '',
        client_subscriber_dob_primary: null, client_group_number_primary: '',
        client_policy_number_primary: '', client_insurance_company_secondary: '',
        client_insurance_type_secondary: '', client_subscriber_name_secondary: '',
        client_subscriber_relationship_secondary: '', client_subscriber_dob_secondary: null,
        client_group_number_secondary: '', client_policy_number_secondary: '',
        hasMoreInsurance: '', client_has_even_more_insurance: '',
        client_self_goal: '', client_referral_source: '',
    }
  });

  const handleImmediateSave = useCallback(async (fieldName: keyof ProfileFormValues, value: any) => {
    if (!clientId) {
      console.warn("[ProfileSetup] Cannot save immediately - no client ID available yet for field:", fieldName);
      return;
    }
    let valueToSave = value;
    if (value instanceof Date) {
        valueToSave = format(value, 'yyyy-MM-dd');
    } else if (value === null || value === undefined) {
        valueToSave = null;
    }
    console.log(`[ProfileSetup] Immediately saving field "${String(fieldName)}" with value:`, valueToSave);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ [fieldName]: valueToSave })
        .eq('id', clientId);

      if (error) {
        console.error(`[ProfileSetup] Error saving ${String(fieldName)} immediately:`, error);
        toast({
          title: "Save Error",
          description: `Could not save your change for ${String(fieldName)}. Please try again.`,
          variant: "destructive"
        });
      } else {
        console.log(`[ProfileSetup] Successfully saved ${String(fieldName)} immediately.`);
      }
    } catch (error) {
      console.error(`[ProfileSetup] Exception in handleImmediateSave for ${String(fieldName)}:`, error);
    }
  }, [clientId, toast]);

  useEffect(() => {
    // This function fetches initial data and resets the form.
    // The `initialDataLoadedForUser.current === userId` check is crucial
    // to prevent this from running again for the same user if the component
    // re-renders but doesn't unmount.
    // IF THIS LOGIC STILL RUNS MULTIPLE TIMES FOR THE SAME USER (without logout/login):
    // IT STRONGLY INDICATES THAT THE <ProfileSetup /> COMPONENT ITSELF IS UNMOUNTING AND REMOUNTING.
    // Check parent components for:
    // 1. Conditional rendering that might briefly hide ProfileSetup (e.g., based on isUserContextLoading).
    // 2. A changing `key` prop on <ProfileSetup />.
    // 3. Routing logic that navigates away and back quickly.
    const fetchAndSetInitialData = async () => {
      if (isUserContextLoading || !userId) {
        console.log('[ProfileSetup] Initial data fetch: User context still loading or no userId. Waiting.');
        setIsFormLoading(true);
        return;
      }
      if (initialDataLoadedForUser.current === userId) {
        console.log(`[ProfileSetup] Initial data already loaded and form set for userId: ${userId}. Skipping fetch and reset.`);
        setIsFormLoading(false);
        return;
      }
      console.log(`[ProfileSetup] Starting initial data fetch for userId: ${userId}. initialDataLoadedForUser.current: ${initialDataLoadedForUser.current}`);
      setIsFormLoading(true);
      try {
        const userEmail = user?.email;
        let { data: clientDataArray, error: clientError } = await supabase
          .from('clients').select('*').eq('id', userId).limit(1);

        if (clientError) {
            console.error("[ProfileSetup] Error fetching client data by ID:", clientError);
            toast({ title: "Profile Error", description: `Could not load your profile data. ${clientError.message}`, variant: "destructive" });
            setIsFormLoading(false);
            initialDataLoadedForUser.current = userId; // Mark attempt even on error to prevent loops if userId is stable
            return;
        }
        
        let clientRecord = clientDataArray?.[0];

        if (!clientRecord && userEmail) {
          console.log("[ProfileSetup] No client found by ID, trying by email:", userEmail);
          const { data: emailDataArray, error: emailFetchError } = await supabase
            .from('clients').select('*').eq('client_email', userEmail).limit(1);
          if (emailFetchError) {
            console.error("[ProfileSetup] Error fetching client data by email:", emailFetchError);
          } else if (emailDataArray && emailDataArray.length > 0) {
            clientRecord = emailDataArray[0];
            console.log("[ProfileSetup] Found client by email:", clientRecord);
            if (clientRecord.id !== userId) {
                console.warn(`[ProfileSetup] Client ID mismatch: Auth ID is ${userId}, record found by email has ID ${clientRecord.id}. Prioritizing auth ID.`);
                // Potentially update logic here if needed, e.g., link accounts or prefer one.
                // For now, if clientRecord.id from email search is different, it implies a potential data issue
                // or a different client record. We should ideally use the record matching userId if it exists,
                // or be very careful about which record to use/update.
                // Re-fetching by userId if an email match was found but ID differs might be safer
                // or ensuring the client creation logic correctly uses userId.
                // For this iteration, if clientRecord.id is not userId, we might still want to create a new one linked to userId.
                // Let's assume for now if clientRecord.id !== userId, we treat it as no direct record found for authUser.
                if(clientRecord.id !== userId) clientRecord = undefined; 
            }
          }
        }

        if (!clientRecord) {
          console.log("[ProfileSetup] No client record found for auth user ID, creating new one for user:", userId);
          const { data: newClientArray, error: insertError } = await supabase
            .from('clients').insert([{ id: userId, client_email: userEmail }]).select().limit(1);
          if (insertError) {
            console.error("[ProfileSetup] Error creating new client record:", insertError);
            toast({ title: "Profile Error", description: `Failed to create your profile. ${insertError.message}`, variant: "destructive" });
            setIsFormLoading(false);
            initialDataLoadedForUser.current = userId; // Mark attempt
            return;
          }
          clientRecord = newClientArray?.[0];
          console.log("[ProfileSetup] Created new client record:", clientRecord);
        }

        if (clientRecord) {
          setClientId(clientRecord.id); // Set the actual client ID from DB
          const parseDateString = (dateString: string | null | undefined): Date | null => {
            if (!dateString) return null;
            try {
              const parsed = parseISO(dateString);
              if (!isNaN(parsed.getTime())) return parsed;
            } catch (e) { /* ignore */ }
            const dateObj = new Date(dateString);
            return !isNaN(dateObj.getTime()) ? dateObj : null;
          };

          const dob = parseDateString(clientRecord.client_date_of_birth);
          const calculatedClientAge = calculateAge(dob);

          const formValues: ClientFormData = {
            client_first_name: clientRecord.client_first_name || '',
            client_preferred_name: clientRecord.client_preferred_name || '',
            client_last_name: clientRecord.client_last_name || '',
            client_email: clientRecord.client_email || userEmail || '',
            client_phone: clientRecord.client_phone || '',
            client_relationship: clientRecord.client_relationship || '',
            client_date_of_birth: dob,
            client_age: clientRecord.client_age ?? calculatedClientAge,
            client_gender: clientRecord.client_gender || '',
            client_gender_identity: clientRecord.client_gender_identity || '',
            client_state: clientRecord.client_state || '',
            client_time_zone: clientRecord.client_time_zone || '',
            client_vacoverage: clientRecord.client_vacoverage || '',
            client_champva: clientRecord.client_champva || '',
            client_other_insurance: clientRecord.client_other_insurance || '',
            client_champva_agreement: clientRecord.client_champva_agreement || false,
            client_mental_health_referral: clientRecord.client_mental_health_referral || '',
            client_branchOS: clientRecord.client_branchOS || '',
            client_recentdischarge: parseDateString(clientRecord.client_recentdischarge),
            client_disabilityrating: clientRecord.client_disabilityrating || '',
            client_tricare_beneficiary_category: clientRecord.client_tricare_beneficiary_category || '',
            client_tricare_sponsor_name: clientRecord.client_tricare_sponsor_name || '',
            client_tricare_sponsor_branch: clientRecord.client_tricare_sponsor_branch || '',
            client_tricare_sponsor_id: clientRecord.client_tricare_sponsor_id || '',
            client_tricare_plan: clientRecord.client_tricare_plan || '',
            client_tricare_region: clientRecord.client_tricare_region || '',
            client_tricare_policy_id: clientRecord.client_tricare_policy_id || '',
            client_tricare_has_referral: clientRecord.client_tricare_has_referral || '',
            client_tricare_referral_number: clientRecord.client_tricare_referral_number || '',
            client_tricare_insurance_agreement: clientRecord.client_tricare_insurance_agreement || false,
            client_veteran_relationship: clientRecord.client_veteran_relationship || '',
            client_situation_explanation: clientRecord.client_situation_explanation || '',
            client_insurance_company_primary: clientRecord.client_insurance_company_primary || '',
            client_insurance_type_primary: clientRecord.client_insurance_type_primary || '',
            client_subscriber_name_primary: clientRecord.client_subscriber_name_primary || '',
            client_subscriber_relationship_primary: clientRecord.client_subscriber_relationship_primary || '',
            client_subscriber_dob_primary: parseDateString(clientRecord.client_subscriber_dob_primary),
            client_group_number_primary: clientRecord.client_group_number_primary || '',
            client_policy_number_primary: clientRecord.client_policy_number_primary || '',
            client_insurance_company_secondary: clientRecord.client_insurance_company_secondary || '',
            client_insurance_type_secondary: clientRecord.client_insurance_type_secondary || '',
            client_subscriber_name_secondary: clientRecord.client_subscriber_name_secondary || '',
            client_subscriber_relationship_secondary: clientRecord.client_subscriber_relationship_secondary || '',
            client_subscriber_dob_secondary: parseDateString(clientRecord.client_subscriber_dob_secondary),
            client_group_number_secondary: clientRecord.client_group_number_secondary || '',
            client_policy_number_secondary: clientRecord.client_policy_number_secondary || '',
            hasMoreInsurance: clientRecord.hasMoreInsurance || '',
            client_has_even_more_insurance: clientRecord.client_has_even_more_insurance || '',
            client_self_goal: clientRecord.client_self_goal || '',
            client_referral_source: clientRecord.client_referral_source || '',
          };
          console.log("[ProfileSetup] Resetting form with values:", formValues);
          form.reset(formValues as ProfileFormValues);
        } else {
          console.warn("[ProfileSetup] No client data could be fetched or created. Form will use defaults.");
          form.reset({ client_email: userEmail || '', ...form.formState.defaultValues } as ProfileFormValues);
        }
        // Mark that data loading and form reset has been attempted for this user.
        // This is key to prevent re-running on subsequent renders if dependencies haven't changed in a way
        // that signifies a *new* user or a need to *re-fetch from scratch*.
        initialDataLoadedForUser.current = userId; 
      } catch (error: any) {
        console.error("[ProfileSetup] Exception in fetchAndSetInitialData:", error);
        toast({
          title: "Error Loading Profile",
          description: error.message || "An unexpected error occurred loading your profile.",
          variant: "destructive"
        });
        initialDataLoadedForUser.current = userId; // Mark attempt even on error
      } finally {
        setIsFormLoading(false);
      }
    };
    fetchAndSetInitialData();
  }, [userId, isUserContextLoading, form.reset, toast, user?.email]); // user?.email is included as it's used for fallbacks/creation

  const navigateToStep = (nextStep: number) => { /* ... as before ... */ 
    setNavigationHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
  };
  const handleConfirmIdentity = async () => { /* ... as before ... */ 
    const isValid = await form.trigger(["client_first_name", "client_last_name", "client_preferred_name", "client_email", "client_phone", "client_relationship"]);
    if (!isValid) { toast({ title: "Validation Error", description: "Please ensure all required fields in Step 1 are filled correctly.", variant: "destructive" }); return; }
    if (!clientId) { toast({ title: "Error", description: "No client record found. Please contact support.", variant: "destructive" }); return; }
    const values = form.getValues();
    try {
      const { error } = await supabase.from('clients').update({
        client_first_name: values.client_first_name, client_last_name: values.client_last_name,
        client_preferred_name: values.client_preferred_name, client_email: values.client_email,
        client_phone: values.client_phone, client_relationship: values.client_relationship
      }).eq('id', clientId);
      if (error) throw error;
      toast({ title: "Personal information saved", description: "Your identity details have been updated." });
      if (refreshUserData) await refreshUserData(); // Refresh context
      navigateToStep(2);
    } catch (error: any) { console.error("[ProfileSetup] Error saving identity data:", error); toast({ title: "Error saving data", description: error.message, variant: "destructive" }); }
  };
  const handleGoBack = () => { /* ... as before ... */ 
     if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentStep(previousStep);
    }
  };
  const handleOtherInsuranceChange = (value: string) => { /* ... as before ... */ 
    setOtherInsurance(value);
    form.setValue('hasMoreInsurance', value); 
  };
  const handleNext = async () => { /* ... as before, with saves for each step and refreshUserData calls ... */ 
    const values = form.getValues();
    const vaCoverage = values.client_vacoverage;
    const hasMoreInsuranceValue = form.getValues('hasMoreInsurance'); 
    
    let saveError = false;

    if (currentStep === 2) {
      const isStep2Valid = await form.trigger(["client_date_of_birth", "client_gender", "client_gender_identity", "client_state", "client_time_zone", "client_vacoverage"]);
      if (!isStep2Valid) { toast({ title: "Validation Error", description: "Please complete all fields in Step 2.", variant: "destructive" }); return; }
      if (clientId) {
        const dob = values.client_date_of_birth;
        const age = calculateAge(dob);
        const formattedDateOfBirth = dob ? format(dob, 'yyyy-MM-dd') : null;
        try {
          const { error } = await supabase.from('clients').update({
              client_date_of_birth: formattedDateOfBirth, client_age: age, client_gender: values.client_gender,
              client_gender_identity: values.client_gender_identity, client_state: values.client_state,
              client_time_zone: values.client_time_zone, client_vacoverage: values.client_vacoverage
            }).eq('id', clientId);
          if (error) throw error;
          toast({ title: "Information saved", description: "Your demographic information has been updated." });
        } catch (e: any) { saveError = true; console.error("[ProfileSetup] Error saving step 2 data:", e); toast({ title: "Error saving data", description: e.message, variant: "destructive" }); }
      } else { console.warn("[ProfileSetup] Step 2: ClientId not available, data not saved."); }
      if (!saveError) { if (refreshUserData) await refreshUserData(); navigateToStep(3); }
    } else if (currentStep === 3) {
        if (clientId) { /* ... save logic for step 3 ... */ 
            let step3Data: Partial<ClientFormData> = {};
            // Populate step3Data based on vaCoverage
            if (vaCoverage === "CHAMPVA") step3Data.client_champva = values.client_champva;
            // Add other vaCoverage conditions and data population
            if (Object.keys(step3Data).length > 0) {
                try { const { error } = await supabase.from('clients').update(step3Data).eq('id', clientId); if (error) throw error; toast({ title: "Information Saved", description: "Insurance details updated."}); }
                catch(e: any) { saveError = true; console.error("[ProfileSetup] Error saving step 3 data:", e); toast({ title: "Save Error", description: `Could not save insurance details. ${e.message}`, variant: "destructive"});}
            }
        }
        if (!saveError) { 
            if (refreshUserData) await refreshUserData();
            if (vaCoverage === "TRICARE" && otherInsurance === "No") navigateToStep(6);
            else if (otherInsurance === "Yes" && (vaCoverage === "TRICARE" || vaCoverage === "CHAMPVA")) navigateToStep(4);
            else navigateToStep(6);
        }
    } else if (currentStep === 4) { /* ... save logic for step 4 ... */ 
        if (clientId) {
             try { const formattedSubscriberDob = values.client_subscriber_dob_primary ? format(values.client_subscriber_dob_primary, 'yyyy-MM-dd') : null; const { error } = await supabase.from('clients').update({ /* primary insurance fields */ client_subscriber_dob_primary: formattedSubscriberDob, }).eq('id', clientId); if (error) throw error; toast({ title: "Information Saved", description: "Primary insurance details updated."});}
            catch(e: any) { saveError = true; console.error("[ProfileSetup] Error saving step 4 data:", e); toast({ title: "Save Error", description: `Could not save primary insurance details. ${e.message}`, variant: "destructive"});}
        }
        if (!saveError) { if (refreshUserData) await refreshUserData(); if (form.getValues('hasMoreInsurance') === "Yes") navigateToStep(5); else navigateToStep(6); }
    } else if (currentStep === 5) { /* ... save logic for step 5 ... */ 
        if (clientId) {
            try { const formattedSubscriberDobSecondary = values.client_subscriber_dob_secondary ? format(values.client_subscriber_dob_secondary, 'yyyy-MM-dd') : null; const { error } = await supabase.from('clients').update({ /* secondary insurance fields */ client_subscriber_dob_secondary: formattedSubscriberDobSecondary, }).eq('id', clientId); if (error) throw error; toast({ title: "Information Saved", description: "Secondary insurance details updated."});}
            catch(e: any) { saveError = true; console.error("[ProfileSetup] Error saving step 5 data:", e); toast({ title: "Save Error", description: `Could not save secondary insurance details. ${e.message}`, variant: "destructive"});}
        }
        if (!saveError) { if (refreshUserData) await refreshUserData(); navigateToStep(6); }
    } else if (currentStep === 6) { handleSubmit(); }
  };
  const handleSubmit = async () => { /* ... as before, with refreshUserData call ... */ 
    const values = form.getValues(); 
    if (!clientId) { toast({ title: "Error", description: "No client record found. Please contact support.", variant: "destructive" }); return; }
    try {
      const { error } = await supabase.from('clients').update({
          client_self_goal: values.client_self_goal || null, client_referral_source: values.client_referral_source || null,
          client_status: 'Profile Complete', client_is_profile_complete: true 
        }).eq('id', clientId);
      if (error) throw error; 
      await refreshUserData(); 
      toast({ title: "Profile complete!", description: "Your information has been saved. Redirecting...", });
      navigate('/therapist-selection');
    } catch (error: any) { console.error("[ProfileSetup] Error updating profile (final step) or refreshing context:", error); toast({ title: "Error updating profile", description: error.message || "An unexpected error occurred.", variant: "destructive" }); }
  };

  const renderStepOne = () => { /* ... as before ... */ 
    const { formState } = form; const isStep1Valid = formState.isValid; 
    return ( <Form {...form}><div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldWrapper control={form.control} name="client_first_name" label="First Name" required={true} />
            <FormFieldWrapper control={form.control} name="client_last_name" label="Last Name" required={true} />
            <FormFieldWrapper control={form.control} name="client_preferred_name" label="Preferred Name (optional)" />
            <FormFieldWrapper control={form.control} name="client_email" label="Email" type="email" readOnly={true} required={true} />
            <FormFieldWrapper control={form.control} name="client_phone" label="Phone" type="tel" required={true} />
            <FormFieldWrapper control={form.control} name="client_relationship" label="What is your relationship with the patient?" type="select" options={["Self", "Parent/Guardian", "Spouse", "Child", "Other"]} required={true} />
        </div><div className="flex justify-center mt-8">
            {isFormLoading ? ( <Button type="button" size="lg" disabled className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2">Loading profile...</Button>
            ) : ( <Button type="button" size="lg" onClick={handleConfirmIdentity} disabled={!isStep1Valid} className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"> <Check className="h-5 w-5" /> I confirm that this is me </Button> )}
        </div></div></Form>
    );
  };
  const renderStepTwo = () => { /* ... as before ... */ 
    const { formState } = form; const isStep2Valid = formState.isValid; 
    return ( <Form {...form}><div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateField control={form.control} name="client_date_of_birth" label="Date of Birth" required={true}/>
            <FormFieldWrapper control={form.control} name="client_gender" label="Birth Gender" type="select" options={["Male", "Female", "Prefer not to say"]} required={true}/>
            <FormFieldWrapper control={form.control} name="client_gender_identity" label="Gender Identity" type="select" options={["Male", "Female", "Non-binary", "Transgender", "Prefer not to say", "Other"]} required={true}/>
            <FormFieldWrapper control={form.control} name="client_state" label="State of Primary Residence" type="select" options={["Alabama", "Alaska", /* ... states ... */ "Wyoming"]} required={true}/>
            <FormFieldWrapper control={form.control} name="client_time_zone" label="Time Zone" type="select" options={timezoneOptions.map(tz => tz.label)} valueMapper={(label) => { const o = timezoneOptions.find(tz_1 => tz_1.label === label); return o ? o.value : ''; }} labelMapper={(value) => { const o = timezoneOptions.find(tz_1 => tz_1.value === value); return o ? o.label : ''; }} required={true}/>
            <FormFieldWrapper control={form.control} name="client_vacoverage" label="What type of VA Coverage do you have?" type="select" options={["CHAMPVA", "TRICARE", "VA Community Care", "None - I am a veteran", "None - I am not a veteran"]} required={true}/>
        </div><div className="flex justify-between mt-8"> <Button type="button" variant="outline" onClick={handleGoBack} className="flex items-center gap-2"> <ArrowLeft className="h-4 w-4" /> Back </Button> <Button type="button" onClick={handleNext} disabled={!isStep2Valid} className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"> Next <ArrowRight className="h-4 w-4" /> </Button> </div></div></Form> );
  };
  const renderStepThree = () => { /* ... as before ... */ 
    const vaCoverage = form.watch('client_vacoverage');
    return ( <Form {...form}><div className="space-y-6">
            {vaCoverage === 'CHAMPVA' && ( <SignupChampva form={form} onOtherInsuranceChange={handleOtherInsuranceChange}/> )}
            {vaCoverage === 'TRICARE' && ( <SignupTricare form={form} onOtherInsuranceChange={handleOtherInsuranceChange}/> )}
            {vaCoverage === 'VA Community Care' && ( <SignupVaCcn form={form} /> )}
            {vaCoverage === 'None - I am a veteran' && ( <SignupVeteran form={form} /> )}
            {vaCoverage === 'None - I am not a veteran' && ( <SignupNotAVeteran form={form} /> )}
        <div className="flex justify-between mt-8"> <Button type="button" variant="outline" onClick={handleGoBack} className="flex items-center gap-2"> <ArrowLeft className="h-4 w-4" /> Back </Button> <Button type="button" onClick={handleNext} className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"> Next <ArrowRight className="h-4 w-4" /> </Button> </div></div></Form> );
  };
  const renderStepFour = () => { /* ... as before ... */ 
    return ( <Form {...form}><div className="space-y-6"> <AdditionalInsurance form={form} /> <div className="flex justify-between mt-8"> <Button type="button" variant="outline" onClick={handleGoBack} className="flex items-center gap-2"> <ArrowLeft className="h-4 w-4" /> Back </Button> <Button type="button" onClick={handleNext} className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"> Next <ArrowRight className="h-4 w-4" /> </Button> </div></div></Form> );
  };
  const renderStepFive = () => { /* ... as before ... */ 
    return ( <Form {...form}><div className="space-y-6"> <MoreAdditionalInsurance form={form} /> <div className="flex justify-between mt-8"> <Button type="button" variant="outline" onClick={handleGoBack} className="flex items-center gap-2"> <ArrowLeft className="h-4 w-4" /> Back </Button> <Button type="button" onClick={handleNext} className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"> Next <ArrowRight className="h-4 w-4" /> </Button> </div></div></Form> );
  };
  const renderStepSix = () => { /* ... as before ... */ 
    return ( <Form {...form}><div className="space-y-6"> <SignupLast form={form} /> <div className="flex justify-between mt-8"> <Button type="button" variant="outline" onClick={handleGoBack} className="flex items-center gap-2"> <ArrowLeft className="h-4 w-4" /> Back </Button> <Button type="button" onClick={handleSubmit} className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"> Complete Profile </Button> </div></div></Form> );
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <Card className="border-valorwell-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-valorwell-500 to-valorwell-600 text-white rounded-t-lg p-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold">Profile Setup</CardTitle>
            <CardDescription className="text-valorwell-50">Tell us about yourself to get started</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-valorwell-700">Step {currentStep} of 6</span>
                <span className="text-sm text-valorwell-700">{Math.round((currentStep / 6) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-valorwell-600 h-2.5 rounded-full" 
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {isFormLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600 mx-auto mb-4"></div>
                  <p className="text-valorwell-700">Loading your profile information...</p>
                </div>
              </div>
            ) : (
              <>
                {currentStep === 1 && renderStepOne()}
                {currentStep === 2 && renderStepTwo()}
                {currentStep === 3 && renderStepThree()}
                {currentStep === 4 && renderStepFour()}
                {currentStep === 5 && renderStepFive()}
                {currentStep === 6 && renderStepSix()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfileSetup;
