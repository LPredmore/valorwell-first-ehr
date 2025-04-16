import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchemas, ProfileFormValues } from '@/validations/profileSchemas';
import { supabase, parseDateString, formatDateForDB } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Context type definitions
interface ProfileSetupContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  navigationHistory: number[];
  clientId: string | null;
  isSubmitting: boolean;
  isProfileCompleted: boolean;
  otherInsurance: string;
  setOtherInsurance: (value: string) => void;
  handleNext: () => Promise<void>;
  handleGoBack: () => void;
  handleSubmit: () => Promise<void>;
  handleConfirmIdentity: () => Promise<void>;
}

const ProfileSetupContext = createContext<ProfileSetupContextType | undefined>(undefined);

export const ProfileSetupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([1]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [otherInsurance, setOtherInsurance] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const isInitialMount = useRef(true);
  const { toast } = useToast();

  // Form setup with React Hook Form
  const methods = useForm<ProfileFormValues>({
    resolver: zodResolver(
      currentStep === 1 
        ? profileSchemas.step1Schema 
        : currentStep === 2 
          ? profileSchemas.step2Schema 
          : profileSchemas.step1Schema
    ),
    mode: "onChange",
    defaultValues: {
      client_first_name: '',
      client_preferred_name: '',
      client_last_name: '',
      client_email: '',
      client_phone: '',
      client_relationship: '',
      client_date_of_birth: undefined,
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
      client_recentdischarge: undefined,
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
      client_subscriber_dob_primary: undefined,
      client_group_number_primary: '',
      client_policy_number_primary: '',
      client_insurance_company_secondary: '',
      client_insurance_type_secondary: '',
      client_subscriber_name_secondary: '',
      client_subscriber_relationship_secondary: '',
      client_subscriber_dob_secondary: undefined,
      client_group_number_secondary: '',
      client_policy_number_secondary: '',
      hasMoreInsurance: '',
      client_has_even_more_insurance: '',
      client_self_goal: '',
      client_referral_source: '',
      tricareInsuranceAgreement: false
    }
  });

  // Data fetching effect
  useEffect(() => {
    // Skip fetching user data if profile is already completed
    if (isProfileCompleted) {
      console.log("Profile is completed, skipping fetchUser");
      return;
    }

    // Skip the initial mount if we're in the middle of completing the profile
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else if (isSubmitting) {
      console.log("Form is submitting, skipping fetchUser");
      return;
    }

    const fetchUser = async () => {
      try {
        console.log("Starting fetchUser function");
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        console.log("Auth getUser result:", { user, authError });
        
        if (authError || !user) {
          console.log("No authenticated user or auth error:", authError);
          return;
        }
        
        console.log("Authenticated user:", user);
        console.log("User ID:", user.id);
        console.log("User email:", user.email);
        
        let { data: clientData, error: clientIdError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id);
          
        console.log("Client query by ID result:", { clientData, clientIdError });
        
        if ((!clientData || clientData.length === 0) && user.email) {
          console.log("No client found by ID, checking by email:", user.email);
          
          const { data: emailData, error: emailError } = await supabase
            .from('clients')
            .select('*')
            .eq('client_email', user.email);
            
          console.log("Client query by email result:", { emailData, emailError });
          
          if (!emailError && emailData && emailData.length > 0) {
            clientData = emailData;
            
            const { error: updateError } = await supabase
              .from('clients')
              .update({ id: user.id })
              .eq('id', clientData[0].id);
              
            if (updateError) {
              console.error("Error updating client ID:", updateError);
            } else {
              const { data: updatedData } = await supabase
                .from('clients')
                .select('*')
                .eq('id', user.id);
                
              if (updatedData && updatedData.length > 0) {
                clientData = updatedData;
              }
            }
          }
        }
        
        if (!clientData || clientData.length === 0) {
          console.log("No client record found, creating new one for user:", user.id);
          
          const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert([
              { 
                id: user.id,
                client_email: user.email,
              }
            ])
            .select();
            
          if (insertError) {
            console.error("Error creating client record:", insertError);
            toast({
              title: "Profile Error", 
              description: "Failed to create your profile. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          clientData = newClient;
          console.log("Created new client record:", clientData);
        }
        
        if (clientData && clientData.length > 0) {
          const data = clientData[0];
          console.log("Processing client data:", data);
          
          // Check if profile is already complete
          if (data.client_status === 'Profile Complete' || data.client_is_profile_complete === 'true') {
            console.log("Profile is already complete, redirecting to therapist selection");
            setIsProfileCompleted(true);
            window.location.href = '/therapist-selection';
            return;
          }
          
          setClientId(data.id);
          
          let dateOfBirth = undefined;
          if (data.client_date_of_birth) {
            // Use parseDateString utility instead of direct Date constructor
            dateOfBirth = parseDateString(data.client_date_of_birth);
            console.log("Parsed date of birth:", dateOfBirth);
          }
          
          let dischargeDate = undefined;
          if (data.client_recentdischarge) {
            // Use parseDateString utility instead of direct Date constructor
            dischargeDate = parseDateString(data.client_recentdischarge);
            console.log("Parsed discharge date:", dischargeDate);
          }
          
          let subscriberDobPrimary = undefined;
          if (data.client_subscriber_dob_primary) {
            // Use parseDateString utility instead of direct Date constructor
            subscriberDobPrimary = parseDateString(data.client_subscriber_dob_primary);
          }
          
          let subscriberDobSecondary = undefined;
          if (data.client_subscriber_dob_secondary) {
            // Use parseDateString utility instead of direct Date constructor
            subscriberDobSecondary = parseDateString(data.client_subscriber_dob_secondary);
          }
          
          console.log("Setting form values with client data");
          
          const formValues = {
            client_first_name: data.client_first_name || '',
            client_preferred_name: data.client_preferred_name || '',
            client_last_name: data.client_last_name || '',
            client_email: data.client_email || '',
            client_phone: data.client_phone || '',
            client_relationship: data.client_relationship || '',
            client_date_of_birth: dateOfBirth,
            client_gender: data.client_gender || '',
            client_gender_identity: data.client_gender_identity || '',
            client_state: data.client_state || '',
            client_time_zone: data.client_time_zone || '',
            client_vacoverage: data.client_vacoverage || '',
            client_champva: data.client_champva || '',
            client_other_insurance: data.client_other_insurance || '',
            client_champva_agreement: data.client_champva_agreement || false,
            client_mental_health_referral: data.client_mental_health_referral || '',
            client_branchOS: data.client_branchOS || '',
            client_recentdischarge: dischargeDate,
            client_disabilityrating: data.client_disabilityrating || '',
            client_tricare_beneficiary_category: data.client_tricare_beneficiary_category || '',
            client_tricare_sponsor_name: data.client_tricare_sponsor_name || '',
            client_tricare_sponsor_branch: data.client_tricare_sponsor_branch || '',
            client_tricare_sponsor_id: data.client_tricare_sponsor_id || '',
            client_tricare_plan: data.client_tricare_plan || '',
            client_tricare_region: data.client_tricare_region || '',
            client_tricare_policy_id: data.client_tricare_policy_id || '',
            client_tricare_has_referral: data.client_tricare_has_referral || '',
            client_tricare_referral_number: data.client_tricare_referral_number || '',
            client_tricare_insurance_agreement: data.client_tricare_insurance_agreement || false,
            client_veteran_relationship: data.client_veteran_relationship || '',
            client_situation_explanation: data.client_situation_explanation || '',
            client_insurance_company_primary: data.client_insurance_company_primary || '',
            client_insurance_type_primary: data.client_insurance_type_primary || '',
            client_subscriber_name_primary: data.client_subscriber_name_primary || '',
            client_subscriber_relationship_primary: data.client_subscriber_relationship_primary || '',
            client_subscriber_dob_primary: subscriberDobPrimary,
            client_group_number_primary: data.client_group_number_primary || '',
            client_policy_number_primary: data.client_policy_number_primary || '',
            client_insurance_company_secondary: data.client_insurance_company_secondary || '',
            client_insurance_type_secondary: data.client_insurance_type_secondary || '',
            client_subscriber_name_secondary: data.client_subscriber_name_secondary || '',
            client_subscriber_relationship_secondary: data.client_subscriber_relationship_secondary || '',
            client_subscriber_dob_secondary: subscriberDobSecondary,
            client_group_number_secondary: data.client_group_number_secondary || '',
            client_policy_number_secondary: data.client_policy_number_secondary || '',
            hasMoreInsurance: data.hasMoreInsurance || '',
            client_has_even_more_insurance: data.client_has_even_more_insurance || '',
            client_self_goal: data.client_self_goal || '',
            client_referral_source: data.client_referral_source || '',
            tricareInsuranceAgreement: data.tricareInsuranceAgreement || false,
          };
          
          console.log("Form values to be set:", formValues);
          methods.reset(formValues);
          console.log("Form reset completed");
          
          setTimeout(() => {
            const currentValues = methods.getValues();
            console.log("Current form values after reset:", currentValues);
          }, 100);
        } else {
          console.log("No client data found after all attempts");
        }
      } catch (error) {
        console.error("Exception in fetchUser:", error);
        toast({
          title: "Error", 
          description: "An unexpected error occurred loading your profile.",
          variant: "destructive"
        });
      }
    };
    
    fetchUser();
  }, [methods, toast, isSubmitting, isProfileCompleted]);

  // Navigation functions
  const navigateToStep = (nextStep: number) => {
    setNavigationHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentStep(previousStep);
    }
  };

  // Form submission handlers
  const handleConfirmIdentity = async () => {
    const isValid = await methods.trigger();
    if (!isValid) {
      return;
    }

    if (!clientId) {
      toast({
        title: "Error",
        description: "No client record found. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    const values = methods.getValues();
    console.log("Saving initial profile data:", values);
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          client_first_name: values.client_first_name,
          client_last_name: values.client_last_name,
          client_preferred_name: values.client_preferred_name,
          client_email: values.client_email,
          client_phone: values.client_phone,
          client_relationship: values.client_relationship
        })
        .eq('id', clientId);
        
      if (error) {
        console.error("Error saving identity data:", error);
        toast({
          title: "Error saving data",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Personal information saved",
        description: "Your identity details have been updated.",
      });
      
      navigateToStep(2);
    } catch (error) {
      console.error("Exception saving identity data:", error);
      toast({
        title: "Error saving data",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleNext = async () => {
    const values = methods.getValues();
    const vaCoverage = values.client_vacoverage;
    const hasMoreInsurance = values.hasMoreInsurance;

    if (currentStep === 2) {
      if (clientId) {
        // Use formatDateForDB utility instead of format function
        const formattedDateOfBirth = values.client_date_of_birth 
          ? formatDateForDB(values.client_date_of_birth) 
          : null;
          
        try {
          const { error } = await supabase
            .from('clients')
            .update({
              client_date_of_birth: formattedDateOfBirth,
              client_gender: values.client_gender,
              client_gender_identity: values.client_gender_identity,
              client_state: values.client_state,
              client_time_zone: values.client_time_zone,
              client_vacoverage: values.client_vacoverage
            })
            .eq('id', clientId);
            
          if (error) {
            console.error("Error saving demographic data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          
          toast({
            title: "Information saved",
            description: "Your demographic information has been updated.",
          });
        } catch (error) {
          console.error("Exception saving demographic data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
          return;
        }
      }
      
      navigateToStep(3);
    } else if (currentStep === 3) {
      if (vaCoverage === "CHAMPVA" && clientId) {
        try {
          console.log("Saving CHAMPVA Information");
          
          const { error } = await supabase
            .from('clients')
            .update({
              client_champva: values.client_champva,
              client_other_insurance: values.client_other_insurance,
              client_champva_agreement: values.client_champva_agreement,
              client_mental_health_referral: values.client_mental_health_referral
            })
            .eq('id', clientId);
            
          if (error) {
            console.error("Error saving CHAMPVA data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Information saved",
              description: "Your CHAMPVA information has been updated.",
            });
          }
        } catch (error) {
          console.error("Exception saving CHAMPVA data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
        }
      } else if (vaCoverage === "TRICARE" && clientId) {
        try {
          console.log("Saving TRICARE Information");
          
          const { error } = await supabase
            .from('clients')
            .update({
              client_tricare_beneficiary_category: values.client_tricare_beneficiary_category,
              client_tricare_sponsor_name: values.client_tricare_sponsor_name,
              client_tricare_sponsor_branch: values.client_tricare_sponsor_branch,
              client_tricare_sponsor_id: values.client_tricare_sponsor_id,
              client_tricare_plan: values.client_tricare_plan,
              client_tricare_region: values.client_tricare_region,
              client_tricare_policy_id: values.client_tricare_policy_id,
              client_tricare_has_referral: values.client_tricare_has_referral,
              client_tricare_referral_number: values.client_tricare_referral_number
            })
            .eq('id', clientId);
            
          if (error) {
            console.error("Error saving TRICARE data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Information saved",
              description: "Your TRICARE information has been updated.",
            });
          }
        } catch (error) {
          console.error("Exception saving TRICARE data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
        }
      } else if (vaCoverage === "None - I am a veteran" && clientId) {
        try {
          console.log("Saving Veteran Information");
          
          // Use formatDateForDB utility instead of format function
          const formattedDischargeDate = values.client_recentdischarge 
            ? formatDateForDB(values.client_recentdischarge) 
            : null;
          
          const { error } = await supabase
            .from('clients')
            .update({
              client_branchOS: values.client_branchOS,
              client_recentdischarge: formattedDischargeDate,
              client_disabilityrating: values.client_disabilityrating
            })
            .eq('id', clientId);
            
          if (error) {
            console.error("Error saving veteran data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Information saved",
              description: "Your veteran information has been updated.",
            });
          }
        } catch (error) {
          console.error("Exception saving veteran data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
        }
      }
      
      if (vaCoverage === "TRICARE" && otherInsurance === "No") {
        navigateToStep(6);
      } else if (otherInsurance === "Yes" && (vaCoverage === "TRICARE" || vaCoverage === "CHAMPVA")) {
        navigateToStep(4);
      } else {
        navigateToStep(6);
      }
    } else if (currentStep === 4) {
      if (clientId) {
        try {
          console.log("Saving primary insurance data");
          
          // Use formatDateForDB utility instead of format function
          const formattedSubscriberDob = values.client_subscriber_dob_primary 
            ? formatDateForDB(values.client_subscriber_dob_primary) 
            : null;
            
          const { error } = await supabase
            .from('clients')
            .update({
              client_insurance_company_primary: values.client_insurance_company_primary,
              client_insurance_type_primary: values.client_insurance_type_primary,
              client_subscriber_name_primary: values.client_subscriber_name_primary,
              client_subscriber_relationship_primary: values.client_subscriber_relationship_primary,
              client_subscriber_dob_primary: formattedSubscriberDob,
              client_group_number_primary: values.client_group_number_primary,
              client_policy_number_primary: values.client_policy_number_primary
            })
            .eq('id', clientId);
            
          if (error) {
            console.error("Error saving primary insurance data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Information saved",
              description: "Your primary insurance information has been updated.",
            });
          }
        } catch (error) {
          console.error("Exception saving primary insurance data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
        }
      }
    
      if (hasMoreInsurance === "Yes") {
        navigateToStep(5);
      } else {
        navigateToStep(6);
      }
    } else if (currentStep === 5) {
      if (clientId) {
        try {
          console.log("Saving secondary insurance data");
          
          // Use formatDateForDB utility instead of format function
          const formattedSubscriberDobSecondary = values.client_subscriber_dob_secondary 
            ? formatDateForDB(values.client_subscriber_dob_secondary) 
            : null;
            
          const { error } = await supabase
            .from('clients')
            .update({
              client_insurance_company_secondary: values.client_insurance_company_secondary,
              client_insurance_type_secondary: values.client_insurance_type_secondary,
              client_subscriber_name_secondary: values.client_subscriber_name_secondary,
              client_subscriber_relationship_secondary: values.client_subscriber_relationship_secondary,
              client_subscriber_dob_secondary: formattedSubscriberDobSecondary,
              client_group_number_secondary: values.client_group_number_secondary,
              client_policy_number_secondary: values.client_policy_number_secondary
            })
            .eq('id', clientId);
            
          if (error) {
            console.error("Error saving secondary insurance data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Information saved",
              description: "Your additional insurance information has been updated.",
            });
          }
        } catch (error) {
          console.error("Exception saving secondary insurance data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
        }
      }
      navigateToStep(6);
    } else if (currentStep === 6) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      // Prevent multiple submissions
      if (isSubmitting || isProfileCompleted) {
        console.log("Submission already in progress or profile already completed, skipping");
        return;
      }
      
      console.log("Starting profile completion process");
      setIsSubmitting(true);
      setIsProfileCompleted(true); // Set this early to prevent race conditions
      
      const formValues = methods.getValues();
      
      if (!formValues.client_time_zone) {
        console.log("Time zone is required but not provided");
        toast({
          title: "Time Zone Required",
          description: "Please select your time zone to continue.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsProfileCompleted(false);
        return;
      }

      if (!clientId) {
        console.log("Client ID not found");
        toast({
          title: "Error",
          description: "Client ID not found. Please try again or contact support.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        setIsProfileCompleted(false);
        return;
      }

      console.log("Updating profile time zone in profiles table");
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          time_zone: formValues.client_time_zone
        })
        .eq('id', clientId);

      if (profileError) {
        console.error("Error updating profile time zone:", profileError);
        throw profileError;
      }

      console.log("Updating client status to 'Profile Complete'");
      const { error } = await supabase
        .from('clients')
        .update({
          client_self_goal: formValues.client_self_goal || null,
          client_referral_source: formValues.client_referral_source || null,
          client_status: 'Profile Complete',
          client_is_profile_complete: 'true'
        })
        .eq('id', clientId);

      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }

      console.log("Profile completion successful, showing success message");
      toast({
        title: "Profile Complete",
        description: "Your profile has been completed successfully."
      });

      // Use window.location.href for immediate navigation
      console.log("Redirecting to therapist selection page");
      window.location.href = '/therapist-selection';
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "There was an error completing your profile. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      setIsProfileCompleted(false);
    }
  };

  // Context value
  const contextValue: ProfileSetupContextType = {
    currentStep,
    setCurrentStep,
    navigationHistory,
    clientId,
    isSubmitting,
    isProfileCompleted,
    otherInsurance,
    setOtherInsurance,
    handleNext,
    handleGoBack,
    handleSubmit,
    handleConfirmIdentity
  };

  return (
    <ProfileSetupContext.Provider value={contextValue}>
      <FormProvider {...methods}>
        {children}
      </FormProvider>
    </ProfileSetupContext.Provider>
  );
};

// Custom hook for using the context
export const useProfileSetup = () => {
  const context = useContext(ProfileSetupContext);
  if (context === undefined) {
    throw new Error('useProfileSetup must be used within a ProfileSetupProvider');
  }
  return context;
};
