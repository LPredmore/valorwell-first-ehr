
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';

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
          name="client_branchOS"
          label="Branch of Service"
          type="select"
          options={[
            "Air Force",
            "Army",
            "Coast Guard",
            "Marine Corps",
            "Navy",
            "Space Force",
            "NOAA Corps",
            "USPHS"
          ]}
        />

        <DateField
          control={form.control}
          name="client_recentdischarge"
          label="Date of Most Recent Discharge"
        />

        <FormFieldWrapper
          control={form.control}
          name="client_disabilityrating"
          label="Current VA Disability Rating"
          type="select"
          options={[
            "0",
            "10",
            "20",
            "30",
            "40",
            "50",
            "60",
            "70",
            "80",
            "90",
            "100",
            "100 P&T",
            "TDIU"
          ]}
        />
      </div>
    </div>
  );
};

export default SignupVeteran;
