
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';
import { Separator } from '@/components/ui/separator';

interface AdditionalInsuranceProps {
  form: UseFormReturn<any>;
  onComplete: () => void;
  onBack: () => void;
}

const AdditionalInsurance: React.FC<AdditionalInsuranceProps> = ({ form, onComplete, onBack }) => {
  const [hasMoreInsurance, setHasMoreInsurance] = useState<string | null>(null);
  
  // Watch for changes to the hasMoreInsurance field
  const formHasMoreInsurance = form.watch('hasMoreInsurance');
  
  useEffect(() => {
    setHasMoreInsurance(formHasMoreInsurance);
  }, [formHasMoreInsurance]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Additional Insurance Information</h3>
      <p className="text-gray-600 mb-4">
        Please provide information about your other insurance coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="otherInsuranceCompany"
          label="Insurance Company Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="otherInsurancePlanType"
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
          name="otherInsuranceSubscriberName"
          label="Subscriber Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="otherInsuranceSubscriberRelationship"
          label="Subscriber Relationship"
          type="select"
          options={["Self", "Child", "Spouse", "Other"]}
        />
        
        <DateField
          control={form.control}
          name="otherInsuranceSubscriberDob"
          label="Subscriber Date of Birth"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="otherInsuranceGroupNumber"
          label="Group Number"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="otherInsurancePolicyNumber"
          label="Policy Number"
          type="text"
        />
        
        <Separator className="my-4" />
        
        <FormFieldWrapper
          control={form.control}
          name="hasMoreInsurance"
          label="Do you have any other insurance you would like to add?"
          type="select"
          options={["Yes", "No"]}
        />
      </div>
    </div>
  );
};

export default AdditionalInsurance;
