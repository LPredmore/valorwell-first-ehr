
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';

interface SignupChampvaProps {
  form: UseFormReturn<any>;
  clientId?: string | null;
}

const SignupChampva: React.FC<SignupChampvaProps> = ({ form, clientId }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Watch for changes to the otherInsurance field
  const otherInsurance = form.watch('otherInsurance');
  const champvaNumber = form.watch('champvaNumber');
  
  useEffect(() => {
    // Show disclaimer only when "No" is selected
    setShowDisclaimer(otherInsurance === "No");
  }, [otherInsurance]);

  // Save CHAMPVA number to database whenever it changes
  useEffect(() => {
    const saveChampvaNumber = async () => {
      if (!clientId || !champvaNumber) return;
      
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('clients')
          .update({
            client_champva: champvaNumber
          })
          .eq('id', clientId);
          
        if (error) {
          console.error('Error saving CHAMPVA number:', error);
        }
      } catch (error) {
        console.error('Error saving CHAMPVA number:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Use a debounce to avoid too many database calls
    const timer = setTimeout(() => {
      if (champvaNumber) {
        saveChampvaNumber();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [champvaNumber, clientId]);

  // Load existing CHAMPVA number when component mounts
  useEffect(() => {
    const loadChampvaNumber = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('client_champva')
          .eq('id', clientId)
          .single();
          
        if (error) {
          console.error('Error loading CHAMPVA number:', error);
        } else if (data && data.client_champva) {
          form.setValue('champvaNumber', data.client_champva);
        }
      } catch (error) {
        console.error('Error loading CHAMPVA number:', error);
      }
    };

    loadChampvaNumber();
  }, [clientId, form]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">CHAMPVA Coverage Details</h3>
      <p className="text-gray-600 mb-4">
        Please provide additional information about your CHAMPVA coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="champvaNumber"
          label="CHAMPVA #"
          type="text"
          maxLength={9}
          disabled={isLoading}
        />
        <p className="text-sm text-gray-500 italic -mt-4">
          We understand that this is your SSN. And although we do not necessarily agree with them using this as their patient identifier, we do have to follow their process. The only way to verify your coverage is to have this.
        </p>
        
        <Separator className="my-4" />
        
        <FormFieldWrapper
          control={form.control}
          name="otherInsurance"
          label="Do you have any other insurance?"
          type="select"
          options={["Yes", "No"]}
        />
        
        {showDisclaimer && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
            <p className="text-sm text-gray-700 mb-4">
              I understand that if I have any other insurance, I have to include it here, even if it doesn't cover the services I will be receiving. CHAMPVA requires other insurances to be billed first, even if it is out of network or they don't cover the service. I understand that if I have other insurance and fail to provide it here, my claims will likely not be covered by CHAMPVA and I will be responsible for the entire cost.
            </p>
            
            <FormField
              control={form.control}
              name="champvaAgreement"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label className="font-medium cursor-pointer">
                    I agree
                  </Label>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupChampva;
