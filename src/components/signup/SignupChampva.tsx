
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';

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
          name="champvaNumber"
          label="CHAMPVA #"
          type="text"
          maxLength={9}
        />
        <p className="text-sm text-gray-500 italic -mt-4">
          We understand that this is your SSN. And although we do not necessarily agree with them using this as their patient identifier, we do have to follow their process. The only way to verify your coverage is to have this.
        </p>
        
        <Separator className="my-4" />
        
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
