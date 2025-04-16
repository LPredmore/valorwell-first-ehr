
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import StepNavigation from '../StepNavigation';

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
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender_identity"
            label="Gender Identity"
            type="select"
            options={[
              "Male", "Female", "Non-binary", "Transgender", "Other", "Prefer not to say"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_state"
            label="State of Residence"
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
              "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
            ]}
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
            options={[
              "CHAMPVA", "TRICARE", "None - I am a veteran", "None - I am not a veteran"
            ]}
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
