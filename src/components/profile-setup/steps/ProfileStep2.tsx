
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import { Database } from '@/integrations/supabase/types';
import StepNavigation from '../StepNavigation';

type StateType = Database['public']['Enums']['states'];
type GenderType = Database['public']['Enums']['client_gender_type'];
type GenderIdentityType = Database['public']['Enums']['client_gender_identity_type'];
type VACoverageType = Database['public']['Enums']['client_va_coverage_type'];

const ProfileStep2 = () => {
  const { handleNext } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  const { formState } = form;
  const isStep2Valid = formState.isValid;
  
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
            options={[
              "Male", "Female", "Intersex", "Prefer not to say"
            ] as GenderType[]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender_identity"
            label="Gender Identity"
            type="select"
            options={[
              "Male", "Female", "Non-binary", "Transgender", "Other", "Prefer not to say"
            ] as GenderIdentityType[]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_state"
            label="State of Residence"
            type="select"
            options={[
              "Alabama", "Alaska", "American Samoa", "Arizona", "Arkansas", "California", "Colorado", 
              "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Guam", "Hawaii", 
              "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", 
              "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", 
              "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", 
              "North Carolina", "North Dakota", "Northern Mariana Islands", "Ohio", "Oklahoma", "Oregon", 
              "Pennsylvania", "Puerto Rico", "Rhode Island", "South Carolina", "South Dakota", 
              "Tennessee", "Texas", "U.S. Virgin Islands", "Utah", "Vermont", "Virginia", "Washington", 
              "West Virginia", "Wisconsin", "Wyoming"
            ] as StateType[]}
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
            options={Object.values(Database['public']['Enums']['client_va_coverage_type'])}
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
