import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import { Database } from '@/integrations/supabase/types';

type RelationshipType = Database['public']['Enums']['client_relationship_type'];

const ProfileStep1 = () => {
  const { handleConfirmIdentity } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  const { formState } = form;
  const isStep1Valid = formState.isValid;
  
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
            type="phone"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_relationship"
            label="What is your relationship with the patient?"
            type="select"
            options={[
              "Self",
              "Parent/Guardian", 
              "Spouse",
              "Child"
            ] as RelationshipType[]}
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

export default ProfileStep1;
