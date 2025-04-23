import React from 'react';
import { ClientDetails } from '@/packages/core/types/client';
import { Form } from 'react-hook-form';

interface MyProfileProps {
  clientData: ClientDetails | null;
  loading: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  form: any;
  isSaving: boolean;
  handleSaveProfile: () => void;
  handleCancelEdit: () => void;
  genderOptions: string[];
  genderIdentityOptions: string[];
  stateOptions: string[];
  timeZoneOptions: string[];
}

const MyProfile: React.FC<MyProfileProps> = ({
  clientData,
  loading,
  isEditing,
  setIsEditing,
  form,
  isSaving,
  handleSaveProfile,
  handleCancelEdit,
  genderOptions,
  genderIdentityOptions,
  stateOptions,
  timeZoneOptions
}) => {
  return null;
};

export default MyProfile;
