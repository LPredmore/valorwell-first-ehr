
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormItem, FormControl, FormLabel } from '@/components/ui/form';

interface SignupNotAVeteranProps {
  form: UseFormReturn<any>;
}

const SignupNotAVeteran: React.FC<SignupNotAVeteranProps> = ({ form }) => {
  // For debugging purposes
  console.log("Veteran relationship field value:", form.watch("client_veteran_relationship"));
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Family Member Information</h3>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <p className="text-blue-700">
          ValorWell was created to serve as a bridge for Veterans and their families. 
          We understand that some spouses and other family members need help as much as 
          the veterans themselves, and we are working with various non-profits to assist 
          with coverage. The below information will help us to get you the coverage you need.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="client_veteran_relationship"
          label="Are you a child or spouse of a veteran?"
          type="select"
          options={["Yes", "No"]}
          required={true}
          defaultValue=""
        />

        <FormField
          control={form.control}
          name="client_situation_explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please explain your situation so that we can understand how to best serve you.</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Type your explanation here..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default SignupNotAVeteran;
