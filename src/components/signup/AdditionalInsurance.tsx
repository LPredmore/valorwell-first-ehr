
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';
import { Separator } from '@/components/ui/separator';

interface AdditionalInsuranceProps {
  form: UseFormReturn<any>;
  onAddAnother: (addAnother: boolean) => void;
  insuranceIndex: number;
}

const AdditionalInsurance: React.FC<AdditionalInsuranceProps> = ({ 
  form, 
  onAddAnother,
  insuranceIndex 
}) => {
  // Get field names with index
  const prefix = `additionalInsurance[${insuranceIndex}]`;
  const companyField = `${prefix}.company`;
  const planTypeField = `${prefix}.planType`;
  const subscriberNameField = `${prefix}.subscriberName`;
  const subscriberRelationshipField = `${prefix}.subscriberRelationship`;
  const subscriberDobField = `${prefix}.subscriberDob`;
  const groupNumberField = `${prefix}.groupNumber`;
  const policyNumberField = `${prefix}.policyNumber`;
  const addAnotherField = `${prefix}.addAnother`;

  // Watch for changes to the addAnother field
  const addAnother = form.watch(addAnotherField);
  
  // Handle change in the "add another" field
  React.useEffect(() => {
    if (addAnother === 'Yes' || addAnother === 'No') {
      onAddAnother(addAnother === 'Yes');
    }
  }, [addAnother, onAddAnother]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">
        {insuranceIndex === 0 ? 'Additional Insurance Information' : `Insurance #${insuranceIndex + 1}`}
      </h3>
      <p className="text-gray-600 mb-4">
        Please provide details about your additional insurance coverage.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormFieldWrapper
          control={form.control}
          name={companyField}
          label="Insurance Company Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={planTypeField}
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
          name={subscriberNameField}
          label="Subscriber Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={subscriberRelationshipField}
          label="Subscriber Relationship"
          type="select"
          options={["Self", "Child", "Spouse", "Other"]}
        />
        
        <DateField
          control={form.control}
          name={subscriberDobField}
          label="Subscriber Date of Birth"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={groupNumberField}
          label="Group Number"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={policyNumberField}
          label="Policy Number"
          type="text"
        />
      </div>
      
      <Separator className="my-4" />
      
      <FormFieldWrapper
        control={form.control}
        name={addAnotherField}
        label="Do you have any other insurance you would like to add?"
        type="select"
        options={["Yes", "No"]}
      />
    </div>
  );
};

export default AdditionalInsurance;
