
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfileFormValues, profileStep1Schema, profileStep2Schema, ProfileFormState } from '../types';
import { saveFormState, loadFormState, formatDateForSupabase } from '../utils';

export const useProfileSetupForm = () => {
  const navigate = (path: string) => {
    window.location.href = path;
  };
  
  const { toast } = useToast();
  const { userId } = useUser(); // Use userId from UserContext
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [state, setState] = useState<ProfileFormState>({
    currentStep: 1,
    navigationHistory: [1],
    otherInsurance: '',
    isSubmitting: false,
    isProfileCompleted: false
  });

  // Initialize form with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(
      state.currentStep === 1 
        ? profileStep1Schema 
        : state.currentStep === 2 
          ? profileStep2Schema 
          : profileStep1Schema
    ),
    mode: "onChange",
    defaultValues: {
      client_first_name: '',
      client_preferred_name: '',
      client_last_name: '',
      client_email: '',
      client_phone: '',
      client_relationship: '',
      client_date_of_birth: undefined as Date | undefined,
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
      client_recentdischarge: undefined as Date | undefined,
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
      client_subscriber_dob_primary: undefined as Date | undefined,
      client_group_number_primary: '',
      client_policy_number_primary: '',
      client_insurance_company_secondary: '',
      client_insurance_type_secondary: '',
      client_subscriber_name_secondary: '',
      client_subscriber_relationship_secondary: '',
      client_subscriber_dob_secondary: undefined as Date | undefined,
      client_group_number_secondary: '',
      client_policy_number_secondary: '',
      hasMoreInsurance: '',
      client_has_even_more_insurance: '',
      client_self_goal: '',
      client_referral_source: '',
      tricareInsuranceAgreement: false
    }
  });

  // Load saved form state and check profile completion status
  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        setIsLoading(true);
        console.log("Checking profile status");
        
        // First try to use the userId from context
        let id = userId;
        
        // If not available, try to get the user from Supabase
        if (!id) {
          const { data: { user } } = await supabase.auth.getUser();
          id = user?.id || null;
        }
        
        if (!id) {
          console.log("No user ID available");
          toast({
            title: "Authentication Error",
            description: "Unable to determine your user ID. Please log in again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching client data for user:", id);
        setClientId(id);
        
        // Check if the profile is already complete
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .maybeSingle();
          
        if (clientError) {
          console.error("Error fetching client data:", clientError);
          toast({
            title: "Data Error",
            description: "Could not retrieve your profile data. Please try again later.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        if (clientData && (clientData.client_status === 'Profile Complete' || clientData.client_is_profile_complete === 'true')) {
          console.log("Profile is already complete");
          setState(prev => ({ ...prev, isProfileCompleted: true }));
          setIsLoading(false);
          
          // Wait a brief moment before redirecting to ensure state updates
          setTimeout(() => {
            navigate('/therapist-selection');
          }, 100);
          return;
        }
        
        // Try to load saved form state
        const { formValues, step } = loadFormState();
        
        if (formValues) {
          console.log("Restoring saved form state:", formValues);
          console.log("Restoring to step:", step);
          form.reset(formValues);
          setState(prev => ({
            ...prev,
            currentStep: step,
            navigationHistory: [...Array(step).keys()].map(i => i + 1),
            otherInsurance: formValues.client_other_insurance || ''
          }));
        }
        
        // If we didn't load from localStorage, try to load from database
        if (!formValues && clientData) {
          console.log("Loading form data from database");
          
          let dateOfBirth = undefined;
          if (clientData.client_date_of_birth) {
            dateOfBirth = new Date(clientData.client_date_of_birth);
          }
          
          let dischargeDate = undefined;
          if (clientData.client_recentdischarge) {
            dischargeDate = new Date(clientData.client_recentdischarge);
          }
          
          const dbFormValues = {
            client_first_name: clientData.client_first_name || '',
            client_preferred_name: clientData.client_preferred_name || '',
            client_last_name: clientData.client_last_name || '',
            client_email: clientData.client_email || '',
            client_phone: clientData.client_phone || '',
            client_relationship: clientData.client_relationship || '',
            client_date_of_birth: dateOfBirth,
            client_gender: clientData.client_gender || '',
            client_gender_identity: clientData.client_gender_identity || '',
            client_state: clientData.client_state || '',
            client_time_zone: clientData.client_time_zone || '',
            client_vacoverage: clientData.client_vacoverage || '',
            client_champva: clientData.client_champva || '',
            client_other_insurance: clientData.client_other_insurance || '',
            client_champva_agreement: clientData.client_champva_agreement || false,
            client_mental_health_referral: clientData.client_mental_health_referral || '',
            client_branchOS: clientData.client_branchOS || '',
            client_recentdischarge: dischargeDate,
            client_disabilityrating: clientData.client_disabilityrating || '',
            client_tricare_beneficiary_category: clientData.client_tricare_beneficiary_category || '',
            client_tricare_sponsor_name: clientData.client_tricare_sponsor_name || '',
            client_tricare_sponsor_branch: clientData.client_tricare_sponsor_branch || '',
            client_tricare_sponsor_id: clientData.client_tricare_sponsor_id || '',
            client_tricare_plan: clientData.client_tricare_plan || '',
            client_tricare_region: clientData.client_tricare_region || '',
            client_tricare_policy_id: clientData.client_tricare_policy_id || '',
            client_tricare_has_referral: clientData.client_tricare_has_referral || '',
            client_tricare_referral_number: clientData.client_tricare_referral_number || '',
            client_tricare_insurance_agreement: clientData.client_tricare_insurance_agreement || false,
            client_veteran_relationship: clientData.client_veteran_relationship || '',
            client_situation_explanation: clientData.client_situation_explanation || '',
            client_self_goal: clientData.client_self_goal || '',
            client_referral_source: clientData.client_referral_source || '',
          } as ProfileFormValues;
          
          form.reset(dbFormValues);
          
          if (clientData.client_other_insurance) {
            setState(prev => ({ ...prev, otherInsurance: clientData.client_other_insurance }));
          }
        }
      } catch (error) {
        console.error("Error in checkProfileStatus:", error);
        toast({
          title: "Error", 
          description: "An unexpected error occurred loading your profile.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkProfileStatus();
  }, [userId, form, toast]);

  // Save form state whenever it changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!isLoading && !state.isSubmitting) {
        saveFormState(value as ProfileFormValues, state.currentStep);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, isLoading, state.isSubmitting, state.currentStep]);

  const navigateToStep = (nextStep: number) => {
    setState(prev => ({
      ...prev,
      navigationHistory: [...prev.navigationHistory, nextStep],
      currentStep: nextStep
    }));
    // Save the form state with the new step
    saveFormState(form.getValues(), nextStep);
  };

  const handleConfirmIdentity = async () => {
    const isValid = await form.trigger();
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

    const values = form.getValues();
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

  const handleGoBack = () => {
    if (state.navigationHistory.length > 1) {
      const newHistory = [...state.navigationHistory];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];
      
      setState(prev => ({
        ...prev,
        navigationHistory: newHistory,
        currentStep: previousStep
      }));
      
      // Save the form state with the new step
      saveFormState(form.getValues(), previousStep);
    }
  };

  const handleOtherInsuranceChange = (value: string) => {
    setState(prev => ({ ...prev, otherInsurance: value }));
    const values = form.getValues();
    values.client_other_insurance = value;
    saveFormState(values, state.currentStep);
  };

  const handleNext = async () => {
    const values = form.getValues();
    const vaCoverage = values.client_vacoverage;
    const hasMoreInsurance = values.hasMoreInsurance;

    if (state.currentStep === 2) {
      if (clientId) {
        const formattedDateOfBirth = formatDateForSupabase(values.client_date_of_birth);
          
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
    } else if (state.currentStep === 3) {
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
          
          const formattedDischargeDate = formatDateForSupabase(values.client_recentdischarge);
          
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
      
      if (vaCoverage === "TRICARE" && state.otherInsurance === "No") {
        navigateToStep(6);
      } else if (state.otherInsurance === "Yes" && (vaCoverage === "TRICARE" || vaCoverage === "CHAMPVA")) {
        navigateToStep(4);
      } else {
        navigateToStep(6);
      }
    } else if (state.currentStep === 4) {
      if (clientId) {
        try {
          console.log("Saving primary insurance data");
          
          const formattedSubscriberDob = formatDateForSupabase(values.client_subscriber_dob_primary);
            
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
    } else if (state.currentStep === 5) {
      if (clientId) {
        try {
          console.log("Saving secondary insurance data");
          
          const formattedSubscriberDobSecondary = formatDateForSupabase(values.client_subscriber_dob_secondary);
            
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
    } else if (state.currentStep === 6) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      if (state.isSubmitting || state.isProfileCompleted) {
        console.log("Submission already in progress or profile already completed, skipping");
        return;
      }
      
      console.log("Starting profile completion process");
      setState(prev => ({ ...prev, isSubmitting: true }));
      
      const formValues = form.getValues();
      
      if (!formValues.client_time_zone) {
        console.log("Time zone is required but not provided");
        toast({
          title: "Time Zone Required",
          description: "Please select your time zone to continue.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }

      if (!clientId) {
        console.log("Client ID not found");
        toast({
          title: "Error",
          description: "Client ID not found. Please try again or contact support.",
          variant: "destructive"
        });
        setState(prev => ({ ...prev, isSubmitting: false }));
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

      // Mark as completed before navigation
      setState(prev => ({ ...prev, isProfileCompleted: true }));
      
      console.log("Profile completion successful, showing success message");
      toast({
        title: "Profile Complete",
        description: "Your profile has been completed successfully."
      });

      // Clear localStorage
      localStorage.removeItem('profileFormValues');
      localStorage.removeItem('profileStep');

      // Redirect with a slight delay to ensure state updates and toast is visible
      setTimeout(() => {
        navigate('/therapist-selection');
      }, 1000);
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "There was an error completing your profile. Please try again.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    form,
    state,
    clientId,
    isLoading,
    handleConfirmIdentity,
    handleGoBack,
    handleOtherInsuranceChange,
    handleNext,
    handleSubmit,
    navigateToStep,
  };
};
