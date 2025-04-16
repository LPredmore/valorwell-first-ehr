
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { DateField } from '@/components/ui/DateField';
import { Card, CardContent } from '@/components/ui/card';

interface MoreAdditionalInsuranceProps {
  form: UseFormReturn<any>;
}

const MoreAdditionalInsurance: React.FC<MoreAdditionalInsuranceProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">More Additional Insurance Information</h3>
      <p className="text-gray-600 mb-4">
        Please provide details about your additional insurance coverage.
      </p>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormFieldWrapper
              control={form.control}
              name="client_insurance_company_secondary"
              label="Insurance Company Name"
              type="text"
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_insurance_type_secondary"
              label="Insurance Plan Type"
              type="select"
              options={[
                "HMO", 
                "PPO", 
                "EPO", 
                "POS", 
                "HDHP", 
                "HSA", 
                "Medicare Advantage", 
                "Medicare", 
                "Medicaid"
              ]}
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_subscriber_name_secondary"
              label="Subscriber Name"
              type="text"
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_subscriber_relationship_secondary"
              label="Subscriber Relationship"
              type="select"
              options={["Self", "Child", "Spouse", "Other"]}
            />
            
            <DateField
              control={form.control}
              name="client_subscriber_dob_secondary"
              label="Subscriber Date of Birth"
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_group_number_secondary"
              label="Group Number"
              type="text"
            />
            
            <FormFieldWrapper
              control={form.control}
              name="client_policy_number_secondary"
              label="Policy Number"
              type="text"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <Separator className="my-4" />
      </div>
    </div>
  );
};

export default MoreAdditionalInsurance;
