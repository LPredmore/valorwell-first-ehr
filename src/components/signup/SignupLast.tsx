
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

export const SignupLast = ({ form }: { form: any }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_self_goal"
            label="What is your goal for therapy? (Optional)"
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_referral_source"
            label="How did you hear about us? (Optional)"
            required={false}
          />
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium">Thank you for completing your profile information. Click "Complete Profile" below to finish setup and proceed to therapist selection.</p>
        </div>
      </div>
    </Form>
  );
};
