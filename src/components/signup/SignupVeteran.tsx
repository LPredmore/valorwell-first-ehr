
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

interface SignupVeteranProps {
  form: UseFormReturn<any>;
}

const SignupVeteran: React.FC<SignupVeteranProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Veteran Information</h3>
      <p className="text-gray-600 mb-4">
        Please provide additional information about your military service.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="branchOfService"
          label="Branch of Service"
          type="select"
          options={[
            "Air Force",
            "Army",
            "Coast Guard",
            "Marine Corps",
            "Navy",
            "Space Force"
          ]}
        />
      </div>
    </div>
  );
};

export default SignupVeteran;
