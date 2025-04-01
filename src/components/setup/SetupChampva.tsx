
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

interface SetupChampvaProps {
  form: UseFormReturn<any>;
}

const SetupChampva: React.FC<SetupChampvaProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">CHAMPVA Coverage Details</h3>
      <p className="text-gray-600 mb-4">
        Remember that CHAMPVA uses a separate policy for every client. 
        This is the number for the client, not their parent/spouse.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper 
          control={form.control} 
          name="champva" 
          label="CHAMPVA #" 
          type="text" 
          maxLength={9} 
        />
        
        <p className="text-sm text-gray-500 italic mt-4">
          We understand that this is your SSN. And although we do not necessarily agree with them using 
          this as their patient identifier, we do have to follow their process. The only way to verify 
          your coverage is to have this.
        </p>
        
        <Separator className="my-4" />
        
        <FormFieldWrapper 
          control={form.control} 
          name="otherInsurance" 
          label="Do you have any other insurance?" 
          type="select" 
          options={["Yes", "No"]} 
        />
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
          <p className="text-sm text-gray-700 mb-4">
            I understand that if I have any other insurance, I have to include it here, even if it doesn't 
            cover the services I will be receiving. CHAMPVA requires other insurances to be billed first, 
            even if it is out of network or they don't cover the service. I understand that if I have 
            other insurance and fail to provide it here, my claims will likely not be covered by CHAMPVA 
            and I will be responsible for the entire cost.
          </p>
          
          <FormField 
            control={form.control} 
            name="champvaAgreement"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label className="font-medium cursor-pointer">
                    I agree
                  </Label>
                  <FormMessage />
                </div>
              </FormItem>
            )} 
          />
        </div>
      </div>
    </div>
  );
};

export default SetupChampva;
