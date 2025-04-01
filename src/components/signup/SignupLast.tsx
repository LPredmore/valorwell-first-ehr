
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormItem, FormControl, FormLabel } from '@/components/ui/form';

interface SignupLastProps {
  form: UseFormReturn<any>;
}

const SignupLast: React.FC<SignupLastProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Final Steps</h3>
      <p className="text-gray-600 mb-4">
        Please tell us a bit more about what brings you here.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="client_self_goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is your Goal for Therapy?</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please describe what you hope to achieve through therapy..."
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Separator className="my-2" />
        
        <FormFieldWrapper
          control={form.control}
          name="client_referral_source"
          label="How did you hear about us?"
          type="select"
          options={[
            "Friend/Family", 
            "Veterans Organization", 
            "Facebook", 
            "Instagram", 
            "TikTok", 
            "Other Social Media", 
            "Online Search", 
            "Other"
          ]}
        />
      </div>
    </div>
  );
};

export default SignupLast;
