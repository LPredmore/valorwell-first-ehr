
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

interface SignupVaCcnProps {
  form: UseFormReturn<any>;
}

const SignupVaCcn: React.FC<SignupVaCcnProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">VA Community Care Network Details</h3>
      <p className="text-gray-600 mb-4">
        Please provide additional information about your VA Community Care coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="mentalHealthReferral"
          label="Have you requested a referral from Mental Health?"
          type="select"
          options={["Yes", "No"]}
        />
      </div>
    </div>
  );
};

export default SignupVaCcn;
