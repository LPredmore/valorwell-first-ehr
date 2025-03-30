
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Separator } from '@/components/ui/separator';

interface SignupTricareProps {
  form: UseFormReturn<any>;
}

const SignupTricare: React.FC<SignupTricareProps> = ({ form }) => {
  const [showReferralField, setShowReferralField] = useState(false);
  
  // Watch for changes to the hasReferral field
  const hasReferral = form.watch('tricareHasReferral');
  
  useEffect(() => {
    // Show referral number field only when "Yes" is selected
    setShowReferralField(hasReferral === "Yes");
  }, [hasReferral]);

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
            "Space Force"
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
      </div>
    </div>
  );
};

export default SignupTricare;
