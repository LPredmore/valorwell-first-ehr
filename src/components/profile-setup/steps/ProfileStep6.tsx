import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import StepNavigation from '../StepNavigation';

const ProfileStep6 = () => {
  const { handleSubmit, isSubmitting } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  
  // Watch for VA coverage to determine if TRICARE agreement is needed
  const vaCoverage = useWatch({
    control: form.control,
    name: 'client_vacoverage',
  });
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Final Steps</h3>
        
        <div className="space-y-6">
          <FormFieldWrapper
            control={form.control}
            name="client_self_goal"
            label="What are your goals for therapy?"
            type="textarea"
            required={true}
            helperText="Please share what you hope to achieve through therapy."
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_referral_source"
            label="How did you hear about us?"
            type="select"
            options={[
              "Friend or Family", "Google Search", "Social Media", "VA Referral", 
              "Doctor Referral", "Insurance Provider", "Other"
            ]}
            required={true}
          />
          
          {vaCoverage === "TRICARE" && (
            <FormFieldWrapper
              control={form.control}
              name="tricareInsuranceAgreement"
              label="I understand that TRICARE may be secondary to other health insurance and I agree to provide all insurance information."
              type="checkbox"
              required={true}
            />
          )}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 mb-4">
            By completing your profile, you'll be able to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-blue-700">
            <li>Select a therapist that matches your needs</li>
            <li>Schedule appointments at times that work for you</li>
            <li>Access your secure client portal</li>
            <li>Begin your therapy journey with ValorWell</li>
          </ul>
        </div>
        
        <StepNavigation 
          nextButtonText="Complete Profile"
          onNext={handleSubmit}
        />
      </div>
    </Form>
  );
};

export default ProfileStep6;
