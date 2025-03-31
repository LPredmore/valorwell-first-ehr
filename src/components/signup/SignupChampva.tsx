
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

interface SignupChampvaProps {
  form: UseFormReturn<any>;
  onOtherInsuranceChange?: (value: string) => void;
}

const SignupChampva: React.FC<SignupChampvaProps> = ({
  form,
  onOtherInsuranceChange
}) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Watch for changes to the otherInsurance field - using local field name
  const otherInsurance = form.watch('other_insurance');
  
  useEffect(() => {
    // Show disclaimer only when "No" is selected
    setShowDisclaimer(otherInsurance === "No");

    // When other insurance is changed, clear the agreement if disclaimer is hidden
    if (otherInsurance !== "No") {
      form.setValue('champva_agreement', false);
    }

    // Call the callback if provided
    if (onOtherInsuranceChange) {
      onOtherInsuranceChange(otherInsurance);
    }
  }, [otherInsurance, form, onOtherInsuranceChange]);

  return <div className="space-y-6">
      <h3 className="text-lg font-medium">CHAMPVA Coverage Details</h3>
      <p className="text-gray-600 mb-4">Remember that CHAMPVA uses a separate policy for every client. This is the number for the client, not their parent/spouse.</p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper control={form.control} name="client_champva" label="CHAMPVA #" type="text" maxLength={9} />
        
        <p className="text-sm text-gray-500 italic">
          We understand that this is your SSN. And although we do not necessarily agree with them using this as their patient identifier, we do have to follow their process. The only way to verify your coverage is to have this.
        </p>
        
        <p className="text-sm text-gray-500">
          *** If you do not want to provide this, please leave it blank and someone will reach out to you over the phone to get this. But this can cause delays in getting your treatment set up.
        </p>
        
        <Separator className="my-4" />
        
        <FormFieldWrapper 
          control={form.control} 
          name="other_insurance" 
          label="Do you have any other insurance?" 
          type="select" 
          options={["Yes", "No"]} 
          required={true}
        />
        
        {showDisclaimer && <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
            <p className="text-sm text-gray-700 mb-4">
              I understand that if I have any other insurance, I have to include it here, even if it doesn't cover the services I will be receiving. CHAMPVA requires other insurances to be billed first, even if it is out of network or they don't cover the service. I understand that if I have other insurance and fail to provide it here, my claims will likely not be covered by CHAMPVA and I will be responsible for the entire cost.
            </p>
            
            <FormField control={form.control} name="champva_agreement" rules={{
          validate: value => {
            // Only require the checkbox when "No" is selected
            if (otherInsurance === "No" && !value) {
              return "You must agree to this statement";
            }
            return true;
          }
        }} render={({
          field
        }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <Label className="font-medium cursor-pointer">
                      I agree
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>} />
          </div>}
      </div>
    </div>;
};

export default SignupChampva;
