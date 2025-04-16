import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import StepNavigation from '../StepNavigation';

const ProfileStep4 = () => {
  const { handleNext } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  
  // Watch for changes to hasMoreInsurance
  const hasMoreInsurance = useWatch({
    control: form.control,
    name: 'hasMoreInsurance',
  });
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Primary Insurance Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_insurance_company_primary"
            label="Insurance Company"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_insurance_type_primary"
            label="Insurance Type"
            type="select"
            options={[
              "PPO", "HMO", "EPO", "POS", "HDHP", "Medicare", "Medicaid", "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_name_primary"
            label="Subscriber Name"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_relationship_primary"
            label="Relationship to Subscriber"
            type="select"
            options={[
              "Self", "Spouse", "Child", "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_dob_primary"
            label="Subscriber Date of Birth"
            type="date"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_group_number_primary"
            label="Group Number"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_policy_number_primary"
            label="Policy/Member ID Number"
            required={true}
          />
        </div>
        
        <FormFieldWrapper
          control={form.control}
          name="hasMoreInsurance"
          label="Do you have additional insurance coverage?"
          type="select"
          options={["Yes", "No"]}
          required={true}
        />
        
        <StepNavigation />
      </div>
    </Form>
  );
};

export default ProfileStep4;
