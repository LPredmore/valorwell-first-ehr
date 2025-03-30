
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormControl, FormLabel } from '@/components/ui/form';

interface SignupTricareProps {
  form: UseFormReturn<any>;
}

const SignupTricare: React.FC<SignupTricareProps> = ({ form }) => {
  const [showReferralField, setShowReferralField] = useState(false);
  const [showInsuranceDisclaimer, setShowInsuranceDisclaimer] = useState(false);
  
  // Watch for changes to the hasReferral and otherInsurance fields
  const hasReferral = form.watch('tricareHasReferral');
  const otherInsurance = form.watch('otherInsurance');
  
  useEffect(() => {
    // Show referral number field only when "Yes" is selected
    setShowReferralField(hasReferral === "Yes");
    
    // Show insurance disclaimer only when "No" is selected for other insurance
    setShowInsuranceDisclaimer(otherInsurance === "No");
  }, [hasReferral, otherInsurance]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">TRICARE Coverage Details</h3>
      <p className="text-gray-600 mb-4">
        Please provide additional information about your TRICARE coverage.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="tricareBeneficiaryCategory"
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
          name="tricareSponsorName"
          label="TRICARE Sponsor's Name"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="tricareSponsorBranch"
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
          name="tricareSponsorId"
          label="TRICARE Sponsor's SSN or DOD ID Number"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="tricarePlan"
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
          name="tricareRegion"
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
          name="tricarePolicyId"
          label="Policy #/Plan ID"
          type="text"
        />
        
        <FormFieldWrapper
          control={form.control}
          name="tricareHasReferral"
          label="Do you have a Referral Number?"
          type="select"
          options={["Yes", "No"]}
        />
        
        {showReferralField && (
          <FormFieldWrapper
            control={form.control}
            name="tricareReferralNumber"
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
        />

        {showInsuranceDisclaimer && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="text-sm text-blue-900 mb-4">
              I understand that if I have any other insurance, I have to include it here, even if it doesn't cover the services I will be receiving. TRICARE requires other insurances to be billed first, even if it is out of network or they don't cover the service. I understand that if I have other insurance and fail to provide it here, my claims will likely not be covered by TRICARE and I will be responsible for the entire cost.
            </p>
            
            <FormField
              control={form.control}
              name="tricareInsuranceAgreement"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-medium cursor-pointer">
                    I agree
                  </FormLabel>
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
