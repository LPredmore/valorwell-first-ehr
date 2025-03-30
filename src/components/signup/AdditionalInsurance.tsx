
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';
import { Separator } from '@/components/ui/separator';

interface AdditionalInsuranceProps {
  form: UseFormReturn<any>;
  index: number;
}

const AdditionalInsurance: React.FC<AdditionalInsuranceProps> = ({ form, index }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Additional Insurance Information {index > 0 ? `(${index + 1})` : ''}</h3>
      <p className="text-gray-600 mb-4">
        Please provide information about your additional insurance coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name={`additionalInsurance.${index}.insuranceCompany`}
          label="Insurance Company Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={`additionalInsurance.${index}.planType`}
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
          name={`additionalInsurance.${index}.subscriberName`}
          label="Subscriber Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={`additionalInsurance.${index}.subscriberRelationship`}
          label="Subscriber Relationship"
          type="select"
          options={["Self", "Child", "Spouse", "Other"]}
        />
        
        <DateField
          control={form.control}
          name={`additionalInsurance.${index}.subscriberDOB`}
          label="Subscriber Date of Birth"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={`additionalInsurance.${index}.groupNumber`}
          label="Group Number"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name={`additionalInsurance.${index}.policyNumber`}
          label="Policy Number"
          type="text"
        />
      </div>
      
      {index === 0 && (
        <>
          <Separator className="my-4" />
          
          <FormFieldWrapper
            control={form.control}
            name="hasMoreInsurance"
            label="Do you have any other insurance you would like to add?"
            type="select"
            options={["Yes", "No"]}
          />
        </>
      )}
    </div>
  );
};

export default AdditionalInsurance;
