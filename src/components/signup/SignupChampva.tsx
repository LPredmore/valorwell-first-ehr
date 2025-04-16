
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { ProfileStepProps } from '@/features/profileSetup/types';

export interface SignupChampvaProps {
  form: any;
  onOtherInsuranceChange?: (value: string) => void;
}

export const SignupChampva: React.FC<SignupChampvaProps> = ({ 
  form, 
  onOtherInsuranceChange 
}) => {
  const handleOtherInsuranceChange = (value: string) => {
    if (onOtherInsuranceChange) {
      onOtherInsuranceChange(value);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_champva"
            label="CHAMPVA Coverage Options"
            type="select"
            options={[
              "In Network",
              "Out of Network"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_other_insurance"
            label="Do you have other insurance coverage?"
            type="select"
            options={["Yes", "No"]}
            required={true}
            valueMapper={(val) => {
              handleOtherInsuranceChange(val);
              return val;
            }}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_mental_health_referral"
            label="Do you have a referral to see a mental health provider?"
            type="select"
            options={["Yes", "No"]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_champva_agreement"
            label="I acknowledge that I will be financially responsible for services rendered if payment is denied by CHAMPVA."
            type="select"
            options={["Yes"]}
            required={true}
          />
        </div>
      </div>
    </Form>
  );
};
