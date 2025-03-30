import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useToast } from '@/hooks/use-toast';
import { timezoneOptions } from '@/utils/timezoneOptions';
import { DateField } from '@/components/ui/DateField';
import { format } from 'date-fns';

// Import specialized signup components
import SignupChampva from '@/components/signup/SignupChampva';
import SignupTricare from '@/components/signup/SignupTricare';
import SignupVaCcn from '@/components/signup/SignupVaCcn';
import SignupVeteran from '@/components/signup/SignupVeteran';
import SignupNotAVeteran from '@/components/signup/SignupNotAVeteran';
import AdditionalInsurance from '@/components/signup/AdditionalInsurance';
import MoreAdditionalInsurance from '@/components/signup/MoreAdditionalInsurance';
import SignupLast from '@/components/signup/SignupLast';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([1]);
  
  const form = useForm({
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
      client_other_insurance: '',
      client_champva_agreement: false,
      client_mental_health_referral: '',
      client_branch_of_service: '',
      client_discharge_date: undefined as Date | undefined,
      client_va_disability_rating: '',
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
      client_has_more_insurance: '',
      client_has_even_more_insurance: '',
      client_therapy_goals: '',
      client_referral_source: '',
      additionalInsurance: [
        {
          companyName: '',
          planType: '',
          subscriberName: '',
          subscriberRelationship: '',
          subscriberDob: undefined as Date | undefined,
          groupNumber: '',
          policyNumber: ''
        }
      ]
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("Authenticated user:", user);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_email', user.email)
          .single();
        
        if (error) {
          console.error('Error fetching client data:', error);
          return;
        }
        
        if (data) {
          console.log("Fetched client data:", data);
          setClientId(data.id);
          
          let dateOfBirth = undefined;
          if (data.client_date_of_birth) {
            dateOfBirth = new Date(data.client_date_of_birth);
          }
          
          let dischargeDate = undefined;
          if (data.client_discharge_date) {
            dischargeDate = new Date(data.client_discharge_date);
          }
          
          form.reset({
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
            client_other_insurance: data.client_other_insurance || '',
            client_champva_agreement: data.client_champva_agreement || false,
            client_mental_health_referral: data.client_mental_health_referral || '',
            client_branch_of_service: data.client_branch_of_service || '',
            client_discharge_date: dischargeDate,
            client_va_disability_rating: data.client_va_disability_rating || '',
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
            client_therapy_goals: data.client_therapy_goals || '',
            client_referral_source: data.client_referral_source || '',
          });
        }
      }
    };
    
    fetchUser();
  }, [form]);

  const navigateToStep = (nextStep: number) => {
    setNavigationHistory(prev => [...prev, nextStep]);
    setCurrentStep(nextStep);
  };

  const handleConfirmIdentity = async () => {
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

  const handleNext = async () => {
    const vaCoverage = form.getValues('client_vacoverage');
    const otherInsurance = form.getValues('client_other_insurance');
    const hasMoreInsurance = form.getValues('client_has_more_insurance');
    
    if (currentStep === 2) {
      if (clientId) {
        const values = form.getValues();
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
            console.error("Error saving step 2 data:", error);
            toast({
              title: "Error saving data",
              description: error.message,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Information saved",
              description: "Your demographic information has been updated.",
            });
          }
        } catch (error) {
          console.error("Exception saving step 2 data:", error);
          toast({
            title: "Error saving data",
            description: "An unexpected error occurred.",
            variant: "destructive"
          });
        }
      }
      
      navigateToStep(3);
    } else if (currentStep === 3) {
      if (vaCoverage === "TRICARE" && otherInsurance === "No") {
        navigateToStep(6);
      } else if (otherInsurance === "Yes" && (vaCoverage === "TRICARE" || vaCoverage === "CHAMPVA")) {
        navigateToStep(4);
      } else {
        navigateToStep(6);
      }
    } else if (currentStep === 4) {
      if (hasMoreInsurance === "Yes") {
        navigateToStep(5);
      } else {
        navigateToStep(6);
      }
    } else if (currentStep === 5) {
      navigateToStep(6);
    } else if (currentStep === 6) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const values = form.getValues();
    
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client record found. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    const formattedDateOfBirth = values.client_date_of_birth ? format(values.client_date_of_birth, 'yyyy-MM-dd') : null;
    const formattedDischargeDate = values.client_discharge_date ? format(values.client_discharge_date, 'yyyy-MM-dd') : null;
    
    const { error } = await supabase
      .from('clients')
      .update({
        client_first_name: values.client_first_name,
        client_preferred_name: values.client_preferred_name,
        client_last_name: values.client_last_name,
        client_phone: values.client_phone,
        client_relationship: values.client_relationship,
        client_date_of_birth: formattedDateOfBirth,
        client_gender: values.client_gender,
        client_gender_identity: values.client_gender_identity,
        client_state: values.client_state,
        client_time_zone: values.client_time_zone,
        client_vacoverage: values.client_vacoverage,
        client_other_insurance: values.client_other_insurance,
        client_mental_health_referral: values.client_mental_health_referral,
        client_branch_of_service: values.client_branch_of_service,
        client_discharge_date: formattedDischargeDate,
        client_va_disability_rating: values.client_va_disability_rating,
        client_champva_agreement: values.client_champva_agreement,
        client_tricare_beneficiary_category: values.client_tricare_beneficiary_category,
        client_tricare_sponsor_name: values.client_tricare_sponsor_name,
        client_tricare_sponsor_branch: values.client_tricare_sponsor_branch,
        client_tricare_sponsor_id: values.client_tricare_sponsor_id,
        client_tricare_plan: values.client_tricare_plan,
        client_tricare_region: values.client_tricare_region,
        client_tricare_policy_id: values.client_tricare_policy_id,
        client_tricare_has_referral: values.client_tricare_has_referral,
        client_tricare_referral_number: values.client_tricare_referral_number,
        client_tricare_insurance_agreement: values.client_tricare_insurance_agreement,
        client_veteran_relationship: values.client_veteran_relationship,
        client_situation_explanation: values.client_situation_explanation,
        client_therapy_goals: values.client_therapy_goals,
        client_referral_source: values.client_referral_source,
        client_status: 'Profile Complete',
        client_is_profile_complete: 'true'
      })
      .eq('id', clientId);
    
    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile complete!",
        description: "Your information has been saved. You can now proceed with scheduling an appointment.",
      });
      navigate('/patient-dashboard');
    }
  };

  const renderStepOne = () => (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_first_name"
            label="First Name"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_last_name"
            label="Last Name"
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
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_phone"
            label="Phone"
            type="tel"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_relationship"
            label="What is your relationship with the patient?"
            type="select"
            options={[
              "Self", "Parent/Guardian", "Spouse", "Child", "Other"
            ]}
          />
        </div>
        
        <div className="flex justify-center mt-8">
          <Button 
            type="button" 
            size="lg" 
            onClick={handleConfirmIdentity}
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            I confirm that this is me
          </Button>
        </div>
      </div>
    </Form>
  );

  const renderStepTwo = () => (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateField
            control={form.control}
            name="client_date_of_birth"
            label="Date of Birth"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender"
            label="Birth Gender"
            type="select"
            options={["Male", "Female"]}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender_identity"
            label="Gender Identity"
            type="select"
            options={["Male", "Female", "Other"]}
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
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Form>
  );

  const renderStepThree = () => {
    const vaCoverage = form.getValues('client_vacoverage');
    
    return (
      <Form {...form}>
        <div className="space-y-6">
          {vaCoverage === 'CHAMPVA' && (
            <SignupChampva form={form} />
          )}
          
          {vaCoverage === 'TRICARE' && (
            <SignupTricare form={form} />
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
            onClick={handleNext}
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
          >
            Complete Profile
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Form>
  );

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6">
        <Card className="shadow-md">
          <CardHeader className="text-center bg-gradient-to-r from-valorwell-50 to-valorwell-100 rounded-t-lg">
            <CardTitle className="text-3xl text-valorwell-700">Welcome to ValorWell!</CardTitle>
            <CardDescription className="text-lg mt-2">
              We're glad you're here. Before scheduling with a therapist, 
              we need to get a little more information about you. Please confirm your information below.
            </CardDescription>
            <p className="mt-4 text-valorwell-600">
              This process will only take 5-10 minutes of your time.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
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
