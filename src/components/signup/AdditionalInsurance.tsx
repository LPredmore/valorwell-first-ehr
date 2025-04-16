
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';

export const AdditionalInsurance = ({ form }: { form: any }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Primary Insurance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_insurance_company_primary"
            label="Insurance Company"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_insurance_type_primary"
            label="Insurance Type"
            type="select"
            options={[
              "PPO",
              "HMO",
              "EPO",
              "POS",
              "HDHP",
              "Other"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_name_primary"
            label="Subscriber Name"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_subscriber_relationship_primary"
            label="Relationship to Subscriber"
            type="select"
            options={[
              "Self",
              "Spouse",
              "Child",
              "Other"
            ]}
            required={true}
          />
          
          <DateField
            control={form.control}
            name="client_subscriber_dob_primary"
            label="Subscriber Date of Birth"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_group_number_primary"
            label="Group Number"
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_policy_number_primary"
            label="Member ID/Policy Number"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="hasMoreInsurance"
            label="Do you have additional insurance?"
            type="select"
            options={["Yes", "No"]}
            required={true}
          />
        </div>
      </div>
    </Form>
  );
};
