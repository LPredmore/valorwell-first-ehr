
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';

export const SignupVeteran = ({ form }: { form: any }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              "Public Health Service",
              "National Oceanic and Atmospheric Administration"
            ]}
            required={true}
          />
          
          <DateField
            control={form.control}
            name="client_recentdischarge"
            label="Date of Most Recent Discharge"
            required={false}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_disabilityrating"
            label="VA Disability Rating (if applicable)"
            type="select"
            options={[
              "Not Rated",
              "0%",
              "10%",
              "20%",
              "30%",
              "40%",
              "50%",
              "60%",
              "70%",
              "80%",
              "90%",
              "100%"
            ]}
            required={false}
          />
        </div>
      </div>
    </Form>
  );
};
