
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

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form setup
  const form = useForm({
    defaultValues: {
      firstName: '',
      preferredName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: '',
      dateOfBirth: undefined as Date | undefined,
      birthGender: '',
      genderIdentity: '',
      state: '',
      timeZone: '',
      vaCoverage: '',
      // Additional fields for specialized forms
      otherInsurance: '',
      mentalHealthReferral: '',
      branchOfService: '',
    }
  });

  // Get current user data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get client record associated with this user
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_email', user.email)
          .single();
        
        if (data) {
          console.log("Fetched client data:", data); // Debug log
          setClientId(data.id);
          
          // Parse date of birth if it exists
          let dateOfBirth = undefined;
          if (data.client_date_of_birth) {
            dateOfBirth = new Date(data.client_date_of_birth);
          }
          
          // Populate form with existing data
          form.reset({
            firstName: data.client_first_name || '',
            preferredName: data.client_preferred_name || '',
            lastName: data.client_last_name || '',
            email: data.client_email || '',
            phone: data.client_phone || '',
            relationship: data.client_relationship || '',
            dateOfBirth: dateOfBirth,
            birthGender: data.client_gender || '',
            genderIdentity: data.client_gender_identity || '',
            state: data.client_state || '',
            timeZone: data.client_time_zone || '',
            vaCoverage: data.client_va_coverage || '',
            otherInsurance: data.client_other_insurance || '',
            mentalHealthReferral: data.client_mental_health_referral || '',
            branchOfService: data.client_branch_of_service || '',
          });
        } else if (error) {
          console.error('Error fetching client data:', error);
        }
      }
    };
    
    fetchUser();
  }, [form]);

  const handleConfirmIdentity = () => {
    setCurrentStep(2);
  };

  const handleGoBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleNext = () => {
    const vaCoverage = form.getValues('vaCoverage');
    
    if (currentStep === 2) {
      // Move to the third step which will conditionally render based on vaCoverage
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Submit the form (completing the profile)
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

    // Format date to ISO string if it exists
    const formattedDateOfBirth = values.dateOfBirth ? format(values.dateOfBirth, 'yyyy-MM-dd') : null;
    
    const { error } = await supabase
      .from('clients')
      .update({
        client_first_name: values.firstName,
        client_preferred_name: values.preferredName,
        client_last_name: values.lastName,
        client_phone: values.phone,
        client_relationship: values.relationship,
        client_date_of_birth: formattedDateOfBirth,
        client_gender: values.birthGender,
        client_gender_identity: values.genderIdentity,
        client_state: values.state,
        client_time_zone: values.timeZone,
        client_va_coverage: values.vaCoverage,
        client_other_insurance: values.otherInsurance,
        client_mental_health_referral: values.mentalHealthReferral,
        client_branch_of_service: values.branchOfService,
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
            name="firstName"
            label="First Name"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="lastName"
            label="Last Name"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="preferredName"
            label="Preferred Name (optional)"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="email"
            label="Email"
            type="email"
            readOnly={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="phone"
            label="Phone"
            type="tel"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="relationship"
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
            name="dateOfBirth"
            label="Date of Birth"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="birthGender"
            label="Birth Gender"
            type="select"
            options={["Male", "Female"]}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="genderIdentity"
            label="Gender Identity"
            type="select"
            options={["Male", "Female", "Other"]}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="state"
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
            name="timeZone"
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
            name="vaCoverage"
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
    const vaCoverage = form.getValues('vaCoverage');
    
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
            <SignupNotAVeteran />
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
              onClick={handleSubmit}
              className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
            >
              Complete Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Form>
    );
  };

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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfileSetup;
