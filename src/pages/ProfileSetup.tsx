import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { format } from 'date-fns';
import SignupChampva from '@/components/signup/SignupChampva';
import SignupTricare from '@/components/signup/SignupTricare';
import SignupVaCcn from '@/components/signup/SignupVaCcn';
import SignupVeteran from '@/components/signup/SignupVeteran';
import SignupNotAVeteran from '@/components/signup/SignupNotAVeteran';
import AdditionalInsurance from '@/components/signup/AdditionalInsurance';
import MoreAdditionalInsurance from '@/components/signup/MoreAdditionalInsurance';
import SignupLast from '@/components/signup/SignupLast';

const profileStep1Schema = z.object({
  client_first_name: z.string().min(1, "First name is required"),
  client_last_name: z.string().min(1, "Last name is required"),
  client_preferred_name: z.string().optional(),
  client_email: z.string().email("Valid email is required"),
  client_phone: z.string().min(10, "Valid phone number is required"),
  client_relationship: z.string().min(1, "Relationship is required"),
});

const profileStep2Schema = z.object({
  client_date_of_birth: z.date({
    required_error: "Date of birth is required",
  }),
  client_gender: z.string().min(1, "Birth gender is required"),
  client_gender_identity: z.string().min(1, "Gender identity is required"),
  client_state: z.string().min(1, "State is required"),
  client_time_zone: z.string().min(1, "Time zone is required"),
  client_vacoverage: z.string().min(1, "VA coverage information is required"),
});

type ProfileFormValues = z.infer<typeof profileStep1Schema> & {
  client_date_of_birth: Date | undefined;
  client_gender: string;
  client_gender_identity: string;
  client_state: string;
  client_time_zone: string;
  client_vacoverage: string;
  client_champva: string;
  client_other_insurance: string;
  client_champva_agreement: boolean;
  client_mental_health_referral: string;
  client_branchOS: string;
  client_recentdischarge: Date | undefined;
  client_disabilityrating: string;
  client_tricare_beneficiary_category: string;
  client_tricare_sponsor_name: string;
  client_tricare_sponsor_branch: string;
  client_tricare_sponsor_id: string;
  client_tricare_plan: string;
  client_tricare_region: string;
  client_tricare_policy_id: string;
  client_tricare_has_referral: string;
  client_tricare_referral_number: string;
  client_tricare_insurance_agreement: boolean;
  client_veteran_relationship: string;
  client_situation_explanation: string;
  client_insurance_company_primary: string;
  client_insurance_type_primary: string;
  client_subscriber_name_primary: string;
  client_subscriber_relationship_primary: string;
  client_subscriber_dob_primary: Date | undefined;
  client_group_number_primary: string;
  client_policy_number_primary: string;
  client_insurance_company_secondary: string;
  client_insurance_type_secondary: string;
  client_subscriber_name_secondary: string;
  client_subscriber_relationship_secondary: string;
  client_subscriber_dob_secondary: Date | undefined;
  client_group_number_secondary: string;
  client_policy_number_secondary: string;
  hasMoreInsurance: string;
  client_has_even_more_insurance: string;
  client_self_goal: string;
  client_referral_source: string;
  tricareInsuranceAgreement: boolean;
};

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([1]);
  const [otherInsurance, setOtherInsurance] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const isInitialMount = useRef(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(
      currentStep === 1 
        ? profileStep1Schema 
        : currentStep === 2 
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

  useEffect(() => {
    if (isProfileCompleted) {
      console.log("Profile is completed, skipping fetchUser");
      return;
    }

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
          
          if (data.client_status === 'Profile Complete' || data.client_is_profile_complete === 'true') {
            console.log("Profile is already complete, redirecting to therapist selection");
            setIsProfileCompleted(true);
            window.location.href = '/therapist-selection';
            return;
          }
          
          setClientId(data.id);
          
          let dateOfBirth = undefined;
          if (data.client_date_of_birth) {
            dateOfBirth = new Date(data.client_date_of_birth);
            console.log("Parsed date of birth:", dateOfBirth);
          }
          
          let dischargeDate = undefined;
          if (data.client_recentdischarge) {
            dischargeDate = new Date(data.client_recentdischarge);
            console.log("Parsed discharge date:", dischargeDate);
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
            client_self_goal: data.client_self_goal || '',
            client_referral_source: data.client_referral_source || '',
          };
          
          console.log("Form values to be set:", formValues);
          form.reset(formValues);
          console.log("Form reset completed");
          
          setTimeout(() => {
            const currentValues = form.getValues();
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
  }, [form, toast, isSubmitting, isProfileCompleted]);

  const navigateToStep = (nextStep: number) => {
    setNavigationHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
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
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousStep = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentStep(previousStep);
    }
  };

  const handleOtherInsuranceChange = (value: string) => {
    setOtherInsurance(value);
  };

  const handleNext = async () => {
    const values = form.getValues();
    const vaCoverage = values.client_vacoverage;
    const hasMoreInsurance = values.hasMoreInsurance;

    if (currentStep === 2) {
      if (clientId) {
        const formattedDateOfBirth = values.client_date_of_birth 
          ? format(values.client_date_of_birth, 'yyyy-MM-dd') 
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
          
          const formattedDischargeDate = values.client_recentdischarge 
            ? format(values.client_recentdischarge, 'yyyy-MM-dd') 
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
          
          const formattedSubscriberDob = values.client_subscriber_dob_primary 
            ? format(values.client_subscriber_dob_primary, 'yyyy-MM-dd') 
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
          
          const formattedSubscriberDobSecondary = values.client_subscriber_dob_secondary 
            ? format(values.client_subscriber_dob_secondary, 'yyyy-MM-dd') 
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
      if (isSubmitting || isProfileCompleted) {
        console.log("Submission already in progress or profile already completed, skipping");
        return;
      }
      
      console.log("Starting profile completion process");
      setIsSubmitting(true);
      setIsProfileCompleted(true);
      
      const formValues = form.getValues();
      
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

  const renderStepOne = () => {
    const { formState } = form;
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
              readOnly={true}
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
            />
          </div>
          
          <div className="flex justify-center mt-8">
            <Button 
              type="button" 
              size="lg" 
              onClick={handleConfirmIdentity}
              disabled={!isStep1Valid}
              className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-5 w-5" />
              I confirm that this is me
            </Button>
          </div>
        </div>
      </Form>
    );
  };

  const renderStepTwo = () => {
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
              options={["Male", "Female"]}
              required={true}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_gender_identity"
              label="Gender Identity"
              type="select"
              options={["Male", "Female", "Other"]}
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
    const vaCoverage = form.getValues('client_vacoverage');
    
    return (
      <Form {...form}>
        <div className="space-y-6">
          {vaCoverage === 'CHAMPVA' && (
            <SignupChampva 
              form={form} 
              onOtherInsuranceChange={handleOtherInsuranceChange}
            />
          )}
          
          {vaCoverage === 'TRICARE' && (
            <SignupTricare 
              form={form}
              onOtherInsuranceChange={handleOtherInsuranceChange}
            />
          )}
          
          {vaCoverage === 'VA Community Care' && (
            <SignupVaCcn form={form} />
          )}
          
          {vaCoverage === 'None - I am a veteran' && (
            <SignupVeteran form={form} />
          )}
          
          {vaCoverage === 'None - I am not a veteran' && (
            <SignupNotAVeteran form={form} />
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
            onClick={handleSubmit}
            disabled={isSubmitting || isProfileCompleted}
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            {isSubmitting ? "Completing..." : "Complete Profile"}
          </Button>
        </div>
      </div>
    </Form>
  );

  if (isProfileCompleted) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <Card className="border-valorwell-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-valorwell-500 to-valorwell-600 text-white rounded-t-lg p-6">
              <CardTitle className="text-xl sm:text-2xl font-semibold">Profile Complete</CardTitle>
              <CardDescription className="text-valorwell-50">Redirecting to therapist selection...</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 flex justify-center items-center">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valorwell-600 mx-auto mb-4"></div>
                <p>Your profile is complete. Redirecting you to select a therapist...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

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
            
            {currentStep === 1 && renderStepOne()}
            {currentStep === 2 && renderStepTwo()}
            {currentStep === 3 && renderStepThree()}
            {currentStep === 4 && renderStepFour()}
            {currentStep === 5 && renderStepFive()}
            {currentStep === 6 && renderStepSix()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfileSetup;
