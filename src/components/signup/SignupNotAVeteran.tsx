
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

export const SignupNotAVeteran = ({ form }: { form: any }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_veteran_relationship"
            label="Do you have a relationship with a veteran?"
            type="select"
            options={[
              "Yes - Spouse/Partner",
              "Yes - Parent",
              "Yes - Child",
              "Yes - Other Family Member",
              "Yes - Friend",
              "Yes - Caregiver",
              "No"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_situation_explanation"
            label="Please briefly describe your current situation"
            required={false}
          />
        </div>
      </div>
    </Form>
  );
};
