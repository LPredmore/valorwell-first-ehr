
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Info } from 'lucide-react';

interface SignupTricareProps {
  form: UseFormReturn<any>;
  onOtherInsuranceChange?: (value: string) => void;
}

const SignupTricare: React.FC<SignupTricareProps> = ({ form, onOtherInsuranceChange }) => {
  const [showReferralField, setShowReferralField] = useState(false);
  const [showInsuranceDisclaimer, setShowInsuranceDisclaimer] = useState(false);
  
  // Use consistent field names with client_ prefix 
  const hasReferral = form.watch('client_tricare_has_referral');
  const otherInsurance = form.watch('otherInsurance');
  
  useEffect(() => {
    // Show referral number field only when "Yes" is selected
    setShowReferralField(hasReferral === "Yes");
    
    // Show insurance disclaimer only when "No" is selected for other insurance
    setShowInsuranceDisclaimer(otherInsurance === "No");
    
    // Call the callback if provided
    if (onOtherInsuranceChange) {
      onOtherInsuranceChange(otherInsurance);
    }
  }, [hasReferral, otherInsurance, onOtherInsuranceChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">TRICARE Coverage Details</h3>
      <p className="text-gray-600 mb-4">
        Please provide additional information about your TRICARE coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_beneficiary_category"
          label="TRICARE Beneficiary Category"
          type="select"
          options={[
            "Active Duty Service Member",
            "Active Duty Family Member",
            "Retired Service Member",
            "Retired Family Member",
            "Guard/Reserve Service Member",
            "Guard/Reserve Family Member",
            "Surviving Family Member",
            "Medal of Honor Recipient",
            "TRICARE For Life",
            "TRICARE Young Adult",
            "Former Spouse",
            "Children with Disabilities"
          ]}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_sponsor_name"
          label="TRICARE Sponsor's Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_sponsor_branch"
          label="TRICARE Sponsor's Branch of Service"
          type="select"
          options={[
            "Air Force",
            "Army",
            "Coast Guard",
            "Marine Corps",
            "Navy",
            "NOAA Corps",
            "Space Force",
            "USPHS"
          ]}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_sponsor_id"
          label="TRICARE Sponsor's SSN or DOD ID Number"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_plan"
          label="TRICARE Plan"
          type="select"
          options={[
            "TRICARE Prime",
            "TRICARE Prime Remote",
            "TRICARE Prime Option",
            "TRICARE Prime Overseas",
            "TRICARE Remote Overseas",
            "TRICARE Select",
            "TRICARE Select Overseas",
            "TRICARE For Life",
            "TRICARE Reserve Select",
            "TRICARE Retired Reserve",
            "TRICARE Young Adult"
          ]}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_region"
          label="TRICARE Region"
          type="select"
          options={[
            "TRICARE East",
            "TRICARE West",
            "TRICARE Overseas"
          ]}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_policy_id"
          label="Policy #/Plan ID"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_has_referral"
          label="Do you have a Referral Number?"
          type="select"
          options={["Yes", "No"]}
        />
        
        {showReferralField && (
          <FormFieldWrapper
            control={form.control}
            name="client_tricare_referral_number"
            label="Referral Number"
            type="text"
          />
        )}
        
        <Separator className="my-4" />
        
        <FormFieldWrapper
          control={form.control}
          name="otherInsurance"
          label="Do you have any other insurance?"
          type="select"
          options={["Yes", "No"]}
          required={true}
        />

        {showInsuranceDisclaimer && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <div className="flex gap-2 items-start mb-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                I understand that if I have any other insurance, I have to include it here, even if it doesn't cover the services I will be receiving. TRICARE requires other insurances to be billed first, even if it is out of network or they don't cover the service. I understand that if I have other insurance and fail to provide it here, my claims will likely not be covered by TRICARE and I will be responsible for the entire cost.
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="tricareInsuranceAgreement"
              rules={{
                validate: (value) => {
                  // Only require the checkbox when "No" is selected
                  if (otherInsurance === "No" && !value) {
                    return "You must agree to this statement";
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium cursor-pointer">
                      I agree
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupTricare;
