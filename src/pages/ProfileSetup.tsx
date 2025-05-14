import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed useQuery as it wasn't used in the provided snippet for fetching user profile
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import FormFieldWrapper, { FormFieldWrapperProps } from '@/components/ui/FormFieldWrapper'; // Assuming FormFieldWrapperProps is exported
import { useToast } from '@/hooks/use-toast';
import { timezoneOptions } from '@/utils/timezoneOptions';
import { DateField } from '@/components/ui/DateField';
import { format, parseISO } from 'date-fns'; // Added parseISO
import SignupChampva from '@/components/signup/SignupChampva';
import SignupTricare from '@/components/signup/SignupTricare';
import SignupVaCcn from '@/components/signup/SignupVaCcn';
import SignupVeteran from '@/components/signup/SignupVeteran';
import SignupNotAVeteran from '@/components/signup/SignupNotAVeteran';
import AdditionalInsurance from '@/components/signup/AdditionalInsurance';
import MoreAdditionalInsurance from '@/components/signup/MoreAdditionalInsurance';
import SignupLast from '@/components/signup/SignupLast';
import { useUser } from '@/context/UserContext'; // Import useUser

// Define a more specific type for what fetchUser returns / form.reset expects
// This should mirror the structure of clientData + any authUser fields needed
type ClientFormData = {
  client_first_name?: string;
  client_last_name?: string;
  client_preferred_name?: string;
  client_email?: string;
  client_phone?: string;
  client_relationship?: string;
  client_date_of_birth?: Date | null; // Allow null for dates from DB
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
  hasMoreInsurance?: string; // This was in ProfileFormValues, ensure it's part of client data if needed
  client_has_even_more_insurance?: string;
  client_self_goal?: string;
  client_referral_source?: string;
  tricareInsuranceAgreement?: boolean; // This was in ProfileFormValues
  // Add any other fields that are part of the 'clients' table and used in the form
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

// Combined type for useForm, ensuring all fields are optional initially or have defaults
// It's often better to have defaultValues provide all keys.
type ProfileFormValues = z.infer<typeof profileStep1Schema> &
  Partial<z.infer<typeof profileStep2Schema>> & { // Make step 2 fields optional for the combined type initially
    // Explicitly list all other fields from your original ProfileFormValues that are not in step1/step2 schemas
    // Ensure their types match what the form and database expect. Default them in useForm.
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
    // tricareInsuranceAgreement?: boolean; // This seems like a duplicate of client_tricare_insurance_agreement
  };


const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: isUserContextLoading, userId } = useUser(); // Get user and loading state

  const [clientId, setClientId] = useState<string | null>(null); // Still useful for knowing the client ID
  const [currentStep, setCurrentStep] = useState(1);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([1]);
  const [otherInsurance, setOtherInsurance] = useState<string>(''); // This state seems specific to step 3 logic
  const [isFormLoading, setIsFormLoading] = useState(true); // Local loading state for form data population

  // Ref to track if the *initial* data load and form.reset has happened for the current user.
  // This helps prevent resetting the form if the component re-renders for other reasons
  // after the initial data load.
  const initialDataLoadedForUser = useRef<string | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(
      currentStep === 1
        ? profileStep1Schema
        : currentStep === 2
        ? profileStep2Schema
        : z.object({}) // Fallback to an empty schema or a relevant one for other steps
    ),
    mode: "onChange",
    defaultValues: {
      client_first_name: '',
      client_preferred_name: '',
      client_last_name: '',
      client_email: '', // Will be populated from auth user
      client_phone: '',
      client_relationship: '',
      client_date_of_birth: null,
      client_gender: '',
      client_gender_identity: '',
      client_state: '',
      client_time_zone: '',
      client_vacoverage: '',
      client_champva: '',
      client_other_insurance: '',
      client_champva_agreement: false,
      client_mental_health_referral: '',
      client_branchOS: '',
      client_recentdischarge: null,
      client_disabilityrating: '',
      client_tricare_beneficiary_category: '',
      client_tricare_sponsor_name: '',
      client_tricare_sponsor_branch: '',
      client_tricare_sponsor_id: '',
      client_tricare_plan: '',
      client_tricare_region: '',
      client_tricare_policy_id: '',
      client_tricare_has_referral: '',
      client_tricare_referral_number: '',
      client_tricare_insurance_agreement: false,
      client_veteran_relationship: '',
      client_situation_explanation: '',
      client_insurance_company_primary: '',
      client_insurance_type_primary: '',
      client_subscriber_name_primary: '',
      client_subscriber_relationship_primary: '',
      client_subscriber_dob_primary: null,
      client_group_number_primary: '',
      client_policy_number_primary: '',
      client_insurance_company_secondary: '',
      client_insurance_type_secondary: '',
      client_subscriber_name_secondary: '',
      client_subscriber_relationship_secondary: '',
      client_subscriber_dob_secondary: null,
      client_group_number_secondary: '',
      client_policy_number_secondary: '',
      hasMoreInsurance: '',
      client_has_even_more_insurance: '',
      client_self_goal: '',
      client_referral_source: '',
    }
  });

  // Memoized function for immediate field saves.
  // Only updates if clientId or toast function reference changes.
  const handleImmediateSave = useCallback(async (fieldName: keyof ProfileFormValues, value: any) => {
    if (!clientId) {
      console.warn("[ProfileSetup] Cannot save immediately - no client ID available yet for field:", fieldName);
      return;
    }
    
    // For date fields, ensure they are formatted correctly or are null
    let valueToSave = value;
    if (value instanceof Date) {
        valueToSave = format(value, 'yyyy-MM-dd');
    } else if (value === null || value === undefined) {
        valueToSave = null;
    }


    console.log(`[ProfileSetup] Immediately saving field "${fieldName}" with value:`, valueToSave);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ [fieldName]: valueToSave })
        .eq('id', clientId);

      if (error) {
        console.error(`[ProfileSetup] Error saving ${fieldName} immediately:`, error);
        toast({
          title: "Save Error",
          description: `Could not save your change for ${fieldName}. Please try again.`,
          variant: "destructive"
        });
      } else {
        console.log(`[ProfileSetup] Successfully saved ${fieldName} immediately.`);
        // Optionally, provide success feedback, though it might be too noisy for every field.
        // toast({ title: "Saved!", description: `${label || fieldName} updated.` });
      }
    } catch (error) {
      console.error(`[ProfileSetup] Exception in handleImmediateSave for ${fieldName}:`, error);
    }
  }, [clientId, toast]);


  // Effect for fetching initial user data and populating the form
  useEffect(() => {
    const fetchAndSetInitialData = async () => {
      // Only proceed if user context is loaded and we have a user ID
      if (isUserContextLoading || !userId) {
        console.log('[ProfileSetup] Initial data fetch: User context still loading or no userId. Waiting.');
        setIsFormLoading(true); // Keep form loading until user context is ready
        return;
      }

      // Check if data has already been loaded and form reset for THIS specific userId
      if (initialDataLoadedForUser.current === userId) {
        console.log(`[ProfileSetup] Initial data already loaded and form set for userId: ${userId}. Skipping fetch.`);
        setIsFormLoading(false); // Data was already loaded
        return;
      }

      console.log(`[ProfileSetup] Starting initial data fetch for userId: ${userId}`);
      setIsFormLoading(true);

      try {
        // User email should be available from UserContext if user is loaded
        const userEmail = user?.email;

        let { data: clientDataArray, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userId)
          .limit(1); // Expecting at most one record

        if (clientError) {
          console.error("[ProfileSetup] Error fetching client data by ID:", clientError);
          // If error fetching by ID, don't attempt email fallback or creation yet.
          // Consider how to handle this - maybe user needs to contact support.
          toast({ title: "Profile Error", description: "Could not load your profile data.", variant: "destructive" });
          setIsFormLoading(false);
          return;
        }
        
        let clientRecord = clientDataArray?.[0];

        // Fallback to email if no record by ID and email is available
        if (!clientRecord && userEmail) {
          console.log("[ProfileSetup] No client found by ID, trying by email:", userEmail);
          const { data: emailDataArray, error: emailFetchError } = await supabase
            .from('clients')
            .select('*')
            .eq('client_email', userEmail)
            .limit(1);

          if (emailFetchError) {
            console.error("[ProfileSetup] Error fetching client data by email:", emailFetchError);
          } else if (emailDataArray && emailDataArray.length > 0) {
            clientRecord = emailDataArray[0];
            console.log("[ProfileSetup] Found client by email. Consider updating its ID to auth user ID if they differ and this is desired.", clientRecord);
            // Potentially update clientRecord.id to user.id here if necessary, though this can be complex.
            // For now, just use the found record.
          }
        }

        // Create new client record if still not found
        if (!clientRecord) {
          console.log("[ProfileSetup] No client record found by ID or email, creating new one for user:", userId);
          const { data: newClientArray, error: insertError } = await supabase
            .from('clients')
            .insert([{ id: userId, client_email: userEmail /* add other essential defaults */ }])
            .select()
            .limit(1);

          if (insertError) {
            console.error("[ProfileSetup] Error creating new client record:", insertError);
            toast({ title: "Profile Error", description: "Failed to create your profile.", variant: "destructive" });
            setIsFormLoading(false);
            return;
          }
          clientRecord = newClientArray?.[0];
          console.log("[ProfileSetup] Created new client record:", clientRecord);
        }

        if (clientRecord) {
          setClientId(clientRecord.id); // Set the actual client ID from DB

          // Helper to parse date strings safely
          const parseDateString = (dateString: string | null | undefined): Date | null => {
            if (!dateString) return null;
            try {
              // Attempt to parse ISO string (common from Supabase)
              const parsed = parseISO(dateString);
              // Check if Luxon thinks it's valid
              if (new Date(parsed).toString() !== "Invalid Date") return parsed;
            } catch (e) { /* ignore parse error, try direct new Date */ }
            
            // Fallback for other date formats, though ISO is preferred from DB
            const dateObj = new Date(dateString);
            return dateObj.toString() !== "Invalid Date" ? dateObj : null;
          };

          const formValues: ClientFormData = {
            client_first_name: clientRecord.client_first_name || '',
            client_preferred_name: clientRecord.client_preferred_name || '',
            client_last_name: clientRecord.client_last_name || '',
            client_email: clientRecord.client_email || userEmail || '', // Prioritize record email, then auth email
            client_phone: clientRecord.client_phone || '',
            client_relationship: clientRecord.client_relationship || '',
            client_date_of_birth: parseDateString(clientRecord.client_date_of_birth),
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
            // tricareInsuranceAgreement: clientRecord.tricareInsuranceAgreement || false, // Check if this field exists in DB
          };
          console.log("[ProfileSetup] Resetting form with values:", formValues);
          form.reset(formValues as ProfileFormValues); // Cast if ClientFormData is a subset
          initialDataLoadedForUser.current = userId; // Mark data as loaded for this user
        } else {
          console.warn("[ProfileSetup] No client data could be fetched or created. Form will use defaults.");
          // If no client record, reset with at least the authenticated user's email
          form.reset({ client_email: userEmail || '', ...form.formState.defaultValues });
          initialDataLoadedForUser.current = userId; // Mark attempt for this user
        }
      } catch (error) {
        console.error("[ProfileSetup] Exception in fetchAndSetInitialData:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred loading your profile.",
          variant: "destructive"
        });
      } finally {
        setIsFormLoading(false);
      }
    };

    fetchAndSetInitialData();
  // Dependencies:
  // - userId: Re-fetch if the user changes.
  // - isUserContextLoading: Wait for context to be ready.
  // - form.reset: React Hook Form's reset function reference (usually stable).
  }, [userId, isUserContextLoading, form.reset, toast]); // Added toast to dependencies as it's used in catch

  // ... rest of the component (navigateToStep, handleConfirmIdentity, handleGoBack, handleNext, handleSubmit, renderStep functions)
  // Ensure that `onValueCommit` is a valid prop for FormFieldWrapper or handle immediate save differently.
  // For example, by watching specific fields with another useEffect and calling handleImmediateSave.

  const renderStepOne = () => {
    const { formState } = form;
    // Step 1 validity should be based on profileStep1Schema
    // The form.formState.isValid might reflect the current step's schema, which is good.
    const isStep1Valid = formState.isValid; 
    
    return (
      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldWrapper
              control={form.control}
              name="client_first_name"
              label="First Name"
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_last_name"
              label="Last Name"
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_preferred_name"
              label="Preferred Name (optional)"
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_email"
              label="Email"
              type="email"
              readOnly={true} // Email from auth should not be changed here
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_phone"
              label="Phone"
              type="tel"
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_relationship"
              label="What is your relationship with the patient?"
              type="select"
              options={[
                "Self", "Parent/Guardian", "Spouse", "Child", "Other"
              ]}
              required={true}
              // onValueCommit={(value) => handleImmediateSave('client_relationship', value)} // Corrected usage
            />
          </div>
          
          <div className="flex justify-center mt-8">
            {isFormLoading ? ( // Use isFormLoading instead of isLoading from UserContext for this button
              <Button 
                type="button" 
                size="lg" 
                disabled
                className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
              >
                Loading profile...
              </Button>
            ) : (
              <Button 
                type="button" 
                size="lg" 
                onClick={handleConfirmIdentity}
                disabled={!isStep1Valid} // Disable if step 1 specific schema is not valid
                className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-5 w-5" />
                I confirm that this is me
              </Button>
            )}
          </div>
        </div>
      </Form>
    );
  };

  const renderStepTwo = () => {
    // Step 2 validity should be based on profileStep2Schema
    const isStep2Valid = form.formState.isValid; 
    
    return (
      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateField
              control={form.control}
              name="client_date_of_birth"
              label="Date of Birth"
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_gender"
              label="Birth Gender"
              type="select"
              options={["Male", "Female"]} // Consider adding "Prefer not to say", "Other"
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_gender_identity"
              label="Gender Identity"
              type="select"
              options={["Male", "Female", "Non-binary", "Transgender", "Prefer not to say", "Other"]}
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_state"
              label="State of Primary Residence"
              type="select"
              options={[
                "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
                "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
                "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
                "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
                "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
                "New Hampshire", "New Jersey", "New Mexico", "New York", 
                "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
                "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
                "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
                "West Virginia", "Wisconsin", "Wyoming"
              ]}
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_time_zone"
              label="Time Zone"
              type="select"
              options={timezoneOptions.map(tz => tz.label)}
              valueMapper={(label) => {
                const option = timezoneOptions.find(tz => tz.label === label);
                return option ? option.value : '';
              }}
              labelMapper={(value) => {
                const option = timezoneOptions.find(tz => tz.value === value);
                return option ? option.label : '';
              }}
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_vacoverage"
              label="What type of VA Coverage do you have?"
              type="select"
              options={[
                "CHAMPVA", 
                "TRICARE", 
                "VA Community Care", 
                "None - I am a veteran", 
                "None - I am not a veteran"
              ]}
              required={true}
            />
          </div>
          
          <div className="flex justify-between mt-8">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button 
              type="button" 
              onClick={handleNext}
              disabled={!isStep2Valid}
              className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Form>
    );
  };

  const renderStepThree = () => {
    const vaCoverage = form.watch('client_vacoverage'); // Use form.watch for reactive updates
    
    return (
      <Form {...form}>
        <div className="space-y-6">
          {vaCoverage === 'CHAMPVA' && (
            <SignupChampva 
              form={form} 
              onOtherInsuranceChange={handleOtherInsuranceChange} // This state needs to be managed if it affects navigation
            />
          )}
          
          {vaCoverage === 'TRICARE' && (
            <SignupTricare 
              form={form}
              onOtherInsuranceChange={handleOtherInsuranceChange} // This state needs to be managed
            />
          )}
          
          {vaCoverage === 'VA Community Care' && (
            <SignupVaCcn form={form} />
          )}
          
          {vaCoverage === 'None - I am a veteran' && (
            <SignupVeteran form={form} />
          )}
          
          {vaCoverage === 'None - I am not a veteran' && (
            // Pass handleImmediateSave if this component has the relationship field
            <SignupNotAVeteran form={form} /* onRelationshipSave={handleImmediateSave} */ />
          )}
          
          <div className="flex justify-between mt-8">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button 
              type="button" 
              onClick={handleNext}
              // Add validation check for step 3 if applicable
              className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Form>
    );
  };

  const renderStepFour = () => (
    <Form {...form}>
      <div className="space-y-6">
        <AdditionalInsurance form={form} />
        
        <div className="flex justify-between mt-8">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="button" 
            onClick={handleNext}
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Form>
  );

  const renderStepFive = () => (
    <Form {...form}>
      <div className="space-y-6">
        <MoreAdditionalInsurance form={form} />
        
        <div className="flex justify-between mt-8">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="button" 
            onClick={handleNext}
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Form>
  );

  const renderStepSix = () => (
    <Form {...form}>
      <div className="space-y-6">
        <SignupLast form={form} />
        
        <div className="flex justify-between mt-8">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="button" 
            onClick={handleSubmit} // This is the final submit
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    </Form>
  );

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
            
            {isFormLoading ? ( // Use local isFormLoading state
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

