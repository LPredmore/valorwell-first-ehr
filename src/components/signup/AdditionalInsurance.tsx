
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/DateField';
import { Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdditionalInsuranceProps {
  form: UseFormReturn<any>;
}

const AdditionalInsurance: React.FC<AdditionalInsuranceProps> = ({ form }) => {
  const [insuranceEntries, setInsuranceEntries] = useState([{ id: 1 }]);
  const [addMoreInsurance, setAddMoreInsurance] = useState<string | null>(null);

  const handleAddInsurance = () => {
    setInsuranceEntries([...insuranceEntries, { id: insuranceEntries.length + 1 }]);
  };

  const handleRemoveInsurance = (id: number) => {
    if (insuranceEntries.length > 1) {
      setInsuranceEntries(insuranceEntries.filter(entry => entry.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Additional Insurance Information</h3>
      <p className="text-gray-600 mb-4">
        Please provide details about your other insurance coverage.
      </p>

      {insuranceEntries.map((entry, index) => (
        <Card key={entry.id} className="mb-6">
          <CardContent className="pt-6">
            {insuranceEntries.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Insurance #{index + 1}</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveInsurance(entry.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldWrapper
                control={form.control}
                name={`additionalInsurance.${index}.companyName`}
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
                name={`additionalInsurance.${index}.subscriberDob`}
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
          </CardContent>
        </Card>
      ))}
      
      {insuranceEntries.length > 0 && (
        <div className="space-y-6">
          <Separator className="my-4" />
          
          <FormFieldWrapper
            control={form.control}
            name="hasMoreInsurance"
            label="Do you have any other Insurance you would like to add?"
            type="select"
            options={["Yes", "No"]}
          />
          
          {form.watch('hasMoreInsurance') === 'Yes' && (
            <Button
              type="button"
              onClick={handleAddInsurance}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Insurance
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdditionalInsurance;
