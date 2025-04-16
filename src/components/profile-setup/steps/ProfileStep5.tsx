import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import StepNavigation from '../StepNavigation';

const ProfileStep5 = () => {
  const { handleNext } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Secondary Insurance Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_insurance_company_secondary"
            label="Insurance Company"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_insurance_type_secondary"
            label="Insurance Type"
            type="select"
            options={[
              "PPO", "HMO", "EPO", "POS", "HDHP", "Medicare", "Medicaid", "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_name_secondary"
            label="Subscriber Name"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_relationship_secondary"
            label="Relationship to Subscriber"
            type="select"
            options={[
              "Self", "Spouse", "Child", "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_dob_secondary"
            label="Subscriber Date of Birth"
            type="date"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_group_number_secondary"
            label="Group Number"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_policy_number_secondary"
            label="Policy/Member ID Number"
            required={true}
          />
        </div>
        
        <FormFieldWrapper
          control={form.control}
          name="client_has_even_more_insurance"
          label="Do you have additional insurance coverage beyond this?"
          type="select"
          options={["Yes", "No"]}
          required={true}
          helperText="If yes, please mention this to your provider during your first appointment."
        />
        
        <StepNavigation />
      </div>
    </Form>
  );
};

export default ProfileStep5;
