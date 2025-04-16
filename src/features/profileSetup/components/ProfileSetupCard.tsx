
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileProgressBar from './ProfileProgressBar';
import ProfileStepOne from './ProfileStepOne';
import ProfileStepTwo from './ProfileStepTwo';
import NavigationButtons from './NavigationButtons';
import { SignupChampva } from '@/components/signup/SignupChampva';
import { SignupTricare } from '@/components/signup/SignupTricare';
import { SignupVaCcn } from '@/components/signup/SignupVaCcn';
import { SignupVeteran } from '@/components/signup/SignupVeteran';
import { SignupNotAVeteran } from '@/components/signup/SignupNotAVeteran';
import { AdditionalInsurance } from '@/components/signup/AdditionalInsurance';
import { MoreAdditionalInsurance } from '@/components/signup/MoreAdditionalInsurance';
import { SignupLast } from '@/components/signup/SignupLast';

interface ProfileSetupCardProps {
  currentStep: number;
  form: any; // Using any here for simplicity in refactoring
  otherInsurance: string;
  isSubmitting: boolean;
  handleConfirmIdentity: () => void;
  handleGoBack: () => void;
  handleOtherInsuranceChange: (value: string) => void;
  handleNext: () => void;
  handleSubmit: () => void;
}

const ProfileSetupCard: React.FC<ProfileSetupCardProps> = ({
  currentStep,
  form,
  otherInsurance,
  isSubmitting,
  handleConfirmIdentity,
  handleGoBack,
  handleOtherInsuranceChange,
  handleNext,
  handleSubmit
}) => {
  const getStepTitle = () => {
    const vaCoverage = form.getValues().client_vacoverage;
    
    if (currentStep === 1) return "Please confirm your identity";
    if (currentStep === 2) return "Tell us about yourself";
    
    if (currentStep === 3) {
      if (vaCoverage === "CHAMPVA") return "CHAMPVA Information";
      if (vaCoverage === "TRICARE") return "TRICARE Information";
      if (vaCoverage === "VA Community Care Network") return "VA Community Care Network Information";
      if (vaCoverage === "None - I am a veteran") return "Veteran Information";
      if (vaCoverage === "None - I am not a veteran") return "Additional Information";
    }
    
    if (currentStep === 4) return "Additional Insurance Information";
    if (currentStep === 5) return "More Insurance Information";
    if (currentStep === 6) return "Final Steps";
    
    return "Profile Setup";
  };

  // Calculate total steps and configurations for progress bar
  const vaCoverage = form.getValues().client_vacoverage || '';
  const hasMoreInsurance = form.getValues().hasMoreInsurance === "Yes";
  const showInsuranceSteps = (vaCoverage === "TRICARE" || vaCoverage === "CHAMPVA") && 
                             otherInsurance === "Yes";
  const totalSteps = showInsuranceSteps && hasMoreInsurance ? 6 : showInsuranceSteps ? 5 : 4;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-2xl font-bold text-center text-gray-800">
          Profile Setup
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          {getStepTitle()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <ProfileProgressBar 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          hasVaCoverage={vaCoverage === "TRICARE" || vaCoverage === "CHAMPVA"}
          hasMoreInsurance={showInsuranceSteps}
        />
        
        {/* Step 1: Identity Confirmation */}
        {currentStep === 1 && (
          <ProfileStepOne 
            form={form} 
            onNext={handleConfirmIdentity} 
          />
        )}
        
        {/* Step 2: Demographics */}
        {currentStep === 2 && (
          <ProfileStepTwo 
            form={form} 
            onNext={handleNext} 
            onBack={handleGoBack} 
          />
        )}
        
        {/* Step 3: VA Coverage Forms */}
        {currentStep === 3 && vaCoverage === "CHAMPVA" && (
          <SignupChampva 
            form={form} 
            onOtherInsuranceChange={handleOtherInsuranceChange} 
          />
        )}
        
        {currentStep === 3 && vaCoverage === "TRICARE" && (
          <SignupTricare 
            form={form} 
            onOtherInsuranceChange={handleOtherInsuranceChange} 
          />
        )}
        
        {currentStep === 3 && vaCoverage === "VA Community Care Network" && (
          <SignupVaCcn form={form} />
        )}
        
        {currentStep === 3 && vaCoverage === "None - I am a veteran" && (
          <SignupVeteran form={form} />
        )}
        
        {currentStep === 3 && vaCoverage === "None - I am not a veteran" && (
          <SignupNotAVeteran form={form} />
        )}
        
        {/* Steps 4-5: Insurance Info */}
        {currentStep === 4 && (
          <AdditionalInsurance form={form} />
        )}
        
        {currentStep === 5 && (
          <MoreAdditionalInsurance form={form} />
        )}
        
        {/* Step 6: Final Step */}
        {currentStep === 6 && (
          <SignupLast form={form} />
        )}
        
        {/* Navigation Buttons (except for step 1 which has its own button) */}
        {currentStep > 1 && (
          <NavigationButtons 
            currentStep={currentStep}
            finalStep={totalSteps}
            onBack={handleGoBack}
            onNext={currentStep < totalSteps ? handleNext : undefined}
            onSubmit={currentStep === totalSteps ? handleSubmit : undefined}
            isSubmitting={isSubmitting}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSetupCard;
