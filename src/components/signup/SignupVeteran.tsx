
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';
import { Textarea } from '@/components/ui/textarea';

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
            "Space Force",
            "NOAA Corps",
            "USPHS"
          ]}
        />

        <DateField
          control={form.control}
          name="dischargeDate"
          label="Date of Most Recent Discharge"
        />

        <FormFieldWrapper
          control={form.control}
          name="vaDisabilityRating"
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

        <FormFieldWrapper
          control={form.control}
          name="isVeteranFamilyMember"
          label="Are you a child or spouse of a veteran?"
          type="select"
          options={["Yes", "No"]}
        />

        <div className="col-span-1">
          <FormFieldWrapper
            control={form.control}
            name="veteranSituation"
            label="Please explain your situation so that we can understand how to best serve you."
            type="text"
          />
          <Textarea
            {...form.register("veteranSituation")}
            className="mt-1 w-full min-h-[120px]"
            placeholder="Please describe your situation..."
          />
        </div>
      </div>
    </div>
  );
};

export default SignupVeteran;
