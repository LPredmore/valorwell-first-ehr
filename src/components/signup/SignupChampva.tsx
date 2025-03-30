
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

interface SignupChampvaProps {
  form: UseFormReturn<any>;
}

const SignupChampva: React.FC<SignupChampvaProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">CHAMPVA Coverage Details</h3>
      <p className="text-gray-600 mb-4">
        Please provide additional information about your CHAMPVA coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="otherInsurance"
          label="Do you have any other insurance?"
          type="select"
          options={["Yes", "No"]}
        />
      </div>
    </div>
  );
};

export default SignupChampva;
