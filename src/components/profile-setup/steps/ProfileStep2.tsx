import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import { Database } from '@/integrations/supabase/types';
import StepNavigation from '../StepNavigation';

type GenderType = Database['public']['Enums']['client_gender_type'];
type GenderIdentityType = Database['public']['Enums']['client_gender_identity_type'];
type StateType = Database['public']['Enums']['states'];
type VACoverageType = Database['public']['Enums']['client_va_coverage_type'];

const ProfileStep2 = () => {
  const { handleNext } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  const { formState } = form;
  const isStep2Valid = formState.isValid;

  // Dynamically get enum values using Object.values()
  const genderTypes: GenderType[] = ["Male", "Female"];
  const genderIdentityTypes: GenderIdentityType[] = ["Male", "Female", "Other"];
  const stateTypes: StateType[] = Object.values(Database['public']['Enums']['states']);
  const vaCoverageTypes: VACoverageType[] = [
    "CHAMPVA", 
    "VA Community Care", 
    "TRICARE", 
    "No Coverage - Veteran", 
    "No Coverage - Not a Veteran"
  ];
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_date_of_birth"
            label="Date of Birth"
            type="date"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender"
            label="Birth Gender"
            type="select"
            options={genderTypes}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender_identity"
            label="Gender Identity"
            type="select"
            options={genderIdentityTypes}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_state"
            label="State of Residence"
            type="select"
            options={stateTypes}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_time_zone"
            label="Time Zone"
            type="select"
            options={[
              "US/Eastern", "US/Central", "US/Mountain", "US/Pacific", "US/Alaska", "US/Hawaii"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_vacoverage"
            label="VA Coverage"
            type="select"
            options={vaCoverageTypes}
            required={true}
          />
        </div>
        
        <StepNavigation 
          isNextDisabled={!isStep2Valid}
        />
      </div>
    </Form>
  );
};

export default ProfileStep2;
