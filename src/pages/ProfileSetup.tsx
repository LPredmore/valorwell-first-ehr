
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useProfileSetupForm } from '@/features/profileSetup/hooks/useProfileSetupForm';
import ProfileSetupCard from '@/features/profileSetup/components/ProfileSetupCard';

const ProfileSetup: React.FC = () => {
  const {
    form,
    state,
    isLoading,
    handleConfirmIdentity,
    handleGoBack,
    handleOtherInsuranceChange,
    handleNext,
    handleSubmit,
  } = useProfileSetupForm();

  // Show loading state if we're still initializing
  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600 mx-auto"></div>
            <p className="text-lg">Loading your profile information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect if profile is already completed
  if (state.isProfileCompleted) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <p className="text-lg">Your profile is complete. Redirecting to therapist selection...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8">
        <ProfileSetupCard
          currentStep={state.currentStep}
          form={form}
          otherInsurance={state.otherInsurance}
          isSubmitting={state.isSubmitting}
          handleConfirmIdentity={handleConfirmIdentity}
          handleGoBack={handleGoBack}
          handleOtherInsuranceChange={handleOtherInsuranceChange}
          handleNext={handleNext}
          handleSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
};

export default ProfileSetup;
