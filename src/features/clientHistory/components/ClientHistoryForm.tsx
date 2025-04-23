
import React from 'react';
import { useForm } from 'react-hook-form';
import { ClientDetails } from '@/packages/core/types/client';
import { ClientHistoryFormData } from '../types';
import { EmergencyContactSection } from './EmergencyContactSection';
import { PersonalSection } from './PersonalSection';
import { ChildhoodSection } from './ChildhoodSection';

interface ClientHistoryFormProps {
  onSubmit: (formData: ClientHistoryFormData) => Promise<void>;
  isSubmitting: boolean;
  clientData: ClientDetails | null;
}

const ClientHistoryForm: React.FC<ClientHistoryFormProps> = ({
  onSubmit,
  isSubmitting,
  clientData
}) => {
  const form = useForm<ClientHistoryFormData>({
    defaultValues: {
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <EmergencyContactSection form={form} />
      <ChildhoodSection form={form} />
      <PersonalSection form={form} />
    </form>
  );
};

export default ClientHistoryForm;
