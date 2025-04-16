
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { ProfileStepProps } from '../types';

const ProfileStepOne: React.FC<ProfileStepProps> = ({ form, onNext }) => {
  const { formState } = form;
  const isStep1Valid = formState.isValid;
  
  const handleConfirmIdentity = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      onNext();
    }
  };
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldWrapper
            control={form.control}
            name="client_first_name"
            label="First Name"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_last_name"
            label="Last Name"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_preferred_name"
            label="Preferred Name (optional)"
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_email"
            label="Email"
            type="email"
            readOnly={true}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_phone"
            label="Phone"
            type="tel"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_relationship"
            label="What is your relationship with the patient?"
            type="select"
            options={[
              "Self", "Parent/Guardian", "Spouse", "Child", "Other"
            ]}
            required={true}
          />
        </div>
        
        <div className="flex justify-center mt-8">
          <Button 
            type="button" 
            size="lg" 
            onClick={handleConfirmIdentity}
            disabled={!isStep1Valid}
            className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-5 w-5" />
            I confirm that this is me
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default ProfileStepOne;
