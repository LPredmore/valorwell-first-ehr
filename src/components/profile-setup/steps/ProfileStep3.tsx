import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { ProfileFormValues } from '@/validations/profileSchemas';
import StepNavigation from '../StepNavigation';

const ProfileStep3 = () => {
  const { handleNext, setOtherInsurance } = useProfileSetup();
  const form = useFormContext<ProfileFormValues>();
  
  // Watch for changes to VA coverage and other insurance
  const vaCoverage = useWatch({
    control: form.control,
    name: 'client_vacoverage',
  });
  
  const otherInsurance = useWatch({
    control: form.control,
    name: 'client_other_insurance',
  });
  
  // Update context when other insurance changes
  useEffect(() => {
    if (otherInsurance) {
      setOtherInsurance(otherInsurance);
    }
  }, [otherInsurance, setOtherInsurance]);
  
  // Render different form sections based on VA coverage
  const renderChampvaForm = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">CHAMPVA Information</h3>
      
      <FormFieldWrapper
        control={form.control}
        name="client_champva"
        label="CHAMPVA Status"
        type="select"
        options={[
          "I am a spouse or dependent of a permanently and totally disabled Veteran",
          "I am a surviving spouse or child of a Veteran who died from a service-connected disability",
          "I am a surviving spouse or child of a Veteran who was rated permanently and totally disabled at the time of death",
          "I am a surviving spouse or child of a military member who died in the line of duty"
        ]}
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_other_insurance"
        label="Do you have other health insurance?"
        type="select"
        options={["Yes", "No"]}
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_champva_agreement"
        label="I understand that CHAMPVA is always secondary to other health insurance."
        type="checkbox"
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_mental_health_referral"
        label="Do you have a referral for mental health services?"
        type="select"
        options={["Yes", "No"]}
        required={true}
      />
    </div>
  );
  
  const renderTricareForm = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">TRICARE Information</h3>
      
      <FormFieldWrapper
        control={form.control}
        name="client_tricare_beneficiary_category"
        label="Beneficiary Category"
        type="select"
        options={[
          "Active Duty Service Member",
          "Active Duty Family Member",
          "Retired Service Member",
          "Retired Family Member",
          "National Guard/Reserve Member",
          "National Guard/Reserve Family Member",
          "Transitional Assistance Management Program (TAMP)",
          "Other"
        ]}
        required={true}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_sponsor_name"
          label="Sponsor Name"
          required={true}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_sponsor_branch"
          label="Sponsor Branch of Service"
          type="select"
          options={[
            "Air Force", "Army", "Coast Guard", "Marine Corps", "Navy", "Space Force"
          ]}
          required={true}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_sponsor_id"
          label="Sponsor ID (SSN or DoD Benefits Number)"
          required={true}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_plan"
          label="TRICARE Plan"
          type="select"
          options={[
            "TRICARE Prime", "TRICARE Prime Remote", "TRICARE Select", 
            "TRICARE For Life", "TRICARE Reserve Select", "TRICARE Retired Reserve",
            "US Family Health Plan", "Other"
          ]}
          required={true}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_region"
          label="TRICARE Region"
          type="select"
          options={[
            "East", "West", "Overseas"
          ]}
          required={true}
        />
        
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_policy_id"
          label="Policy ID Number"
          required={true}
        />
      </div>
      
      <FormFieldWrapper
        control={form.control}
        name="client_tricare_has_referral"
        label="Do you have a referral for mental health services?"
        type="select"
        options={["Yes", "No"]}
        required={true}
      />
      
      {form.watch('client_tricare_has_referral') === 'Yes' && (
        <FormFieldWrapper
          control={form.control}
          name="client_tricare_referral_number"
          label="Referral Number"
          required={true}
        />
      )}
      
      <FormFieldWrapper
        control={form.control}
        name="client_other_insurance"
        label="Do you have other health insurance?"
        type="select"
        options={["Yes", "No"]}
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_tricare_insurance_agreement"
        label="I understand that TRICARE may be secondary to other health insurance."
        type="checkbox"
        required={true}
      />
    </div>
  );
  
  const renderVeteranForm = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Veteran Information</h3>
      
      <FormFieldWrapper
        control={form.control}
        name="client_branchOS"
        label="Branch of Service"
        type="select"
        options={[
          "Air Force", "Army", "Coast Guard", "Marine Corps", "Navy", "Space Force"
        ]}
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_recentdischarge"
        label="Date of Discharge"
        type="date"
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_disabilityrating"
        label="VA Disability Rating"
        type="select"
        options={[
          "0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%", "Not Rated", "Pending"
        ]}
        required={true}
      />
    </div>
  );
  
  const renderNonVeteranForm = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Non-Veteran Information</h3>
      
      <FormFieldWrapper
        control={form.control}
        name="client_veteran_relationship"
        label="What is your relationship to a veteran?"
        type="select"
        options={[
          "Spouse of a veteran", "Child of a veteran", "Parent of a veteran", 
          "Sibling of a veteran", "Friend of a veteran", "No relationship to a veteran"
        ]}
        required={true}
      />
      
      <FormFieldWrapper
        control={form.control}
        name="client_situation_explanation"
        label="Please briefly explain your situation and interest in our services"
        type="textarea"
        required={true}
      />
    </div>
  );
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        {vaCoverage === "CHAMPVA" && renderChampvaForm()}
        {vaCoverage === "TRICARE" && renderTricareForm()}
        {vaCoverage === "None - I am a veteran" && renderVeteranForm()}
        {vaCoverage === "None - I am not a veteran" && renderNonVeteranForm()}
        
        <StepNavigation />
      </div>
    </Form>
  );
};

export default ProfileStep3;
