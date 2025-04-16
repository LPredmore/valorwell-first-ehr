import React from 'react';
import { ProfileSetupProvider } from '@/contexts/ProfileSetupContext';
import ProfileSetupContent from '@/components/profile-setup/ProfileSetupContent';

const ProfileSetup = () => {
  return (
    <ProfileSetupProvider>
      <ProfileSetupContent />
    </ProfileSetupProvider>
  );
};

export default ProfileSetup;
