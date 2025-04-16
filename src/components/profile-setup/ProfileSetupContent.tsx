import React from 'react';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import ProgressIndicator from './ProgressIndicator';
import ProfileStep1 from './steps/ProfileStep1';
import ProfileStep2 from './steps/ProfileStep2';
import ProfileStep3 from './steps/ProfileStep3';
import ProfileStep4 from './steps/ProfileStep4';
import ProfileStep5 from './steps/ProfileStep5';
import ProfileStep6 from './steps/ProfileStep6';

const ProfileSetupContent = () => {
  const { currentStep, isProfileCompleted, isSubmitting } = useProfileSetup();
  
  // If profile is completed and submission is in progress, show loading state
  if (isProfileCompleted && isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-16 h-16 border-4 border-valorwell-200 border-t-valorwell-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-valorwell-700 mb-2">Completing Your Profile</h2>
        <p className="text-gray-600 text-center">
          Please wait while we save your information and prepare your therapist selection page...
        </p>
      </div>
    );
  }
  
  // If profile is completed but not submitting, user will be redirected by the context
  if (isProfileCompleted) {
    return null;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-valorwell-800 mb-6">Profile Setup</h1>
      
      <ProgressIndicator currentStep={currentStep} totalSteps={6} />
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        {currentStep === 1 && <ProfileStep1 />}
        {currentStep === 2 && <ProfileStep2 />}
        {currentStep === 3 && <ProfileStep3 />}
        {currentStep === 4 && <ProfileStep4 />}
        {currentStep === 5 && <ProfileStep5 />}
        {currentStep === 6 && <ProfileStep6 />}
      </div>
    </div>
  );
};

export default ProfileSetupContent;
