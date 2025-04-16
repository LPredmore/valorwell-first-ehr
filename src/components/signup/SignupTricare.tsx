
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

export interface SignupTricareProps {
  form: any;
  onOtherInsuranceChange?: (value: string) => void;
}

export const SignupTricare: React.FC<SignupTricareProps> = ({ 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_beneficiary_category"
            label="Beneficiary Category"
            type="select"
            options={[
              "Active Duty Service Member",
              "Active Duty Family Member",
              "Retiree",
              "Retiree Family Member",
              "National Guard/Reserve",
              "National Guard/Reserve Family Member",
              "Transitional Assistance Management Program (TAMP)",
              "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_sponsor_name"
            label="Sponsor Name (if applicable)"
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_sponsor_branch"
            label="Sponsor Branch of Service"
            type="select"
            options={[
              "Air Force",
              "Army",
              "Coast Guard",
              "Marine Corps",
              "Navy",
              "Space Force",
              "Public Health Service",
              "National Oceanic and Atmospheric Administration"
            ]}
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_sponsor_id"
            label="Sponsor Service ID/SSN"
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_plan"
            label="TRICARE Plan"
            type="select"
            options={[
              "TRICARE Prime",
              "TRICARE Prime Remote",
              "TRICARE Prime Overseas",
              "TRICARE Prime Remote Overseas",
              "TRICARE Select",
              "TRICARE Select Overseas",
              "TRICARE For Life",
              "TRICARE Young Adult Prime",
              "TRICARE Young Adult Select",
              "US Family Health Plan",
              "TRICARE Reserve Select",
              "TRICARE Retired Reserve",
              "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_region"
            label="TRICARE Region"
            type="select"
            options={[
              "East",
              "West",
              "Overseas"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_policy_id"
            label="TRICARE Policy ID/DBN (if known)"
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_has_referral"
            label="Do you have a referral for mental health services?"
            type="select"
            options={["Yes", "No"]}
            required={true}
          />
          
          {form.watch("client_tricare_has_referral") === "Yes" && (
            <FormFieldWrapper
              control={form.control}
              name="client_tricare_referral_number"
              label="Referral Number"
              required={false}
            />
          )}
          
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
        </div>
        
        <div className="mt-4">
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_insurance_agreement"
            label="I acknowledge that I will be financially responsible for services rendered if payment is denied by TRICARE."
            type="select"
            options={["Yes"]}
            required={true}
          />
        </div>
      </div>
    </Form>
  );
};
