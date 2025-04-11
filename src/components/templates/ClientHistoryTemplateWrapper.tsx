
import React from 'react';
import ClientHistoryTemplate from './ClientHistoryTemplate';
import { ClientDetails } from '@/types/client';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentClientAge } from '@/hooks/useClientData';

interface ClientHistoryTemplateWrapperProps {
  onSubmit: (formData: any) => void;
  isSubmitting: boolean;
  clientData: ClientDetails | null;
  isLoadingClient: boolean;
}

const ClientHistoryTemplateWrapper: React.FC<ClientHistoryTemplateWrapperProps> = ({
  onSubmit,
  isSubmitting,
  clientData,
  isLoadingClient
}) => {
  // Calculate derived data
  const fullName = clientData ? 
    `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`.trim() : '';
  const age = clientData?.client_date_of_birth ? 
    getCurrentClientAge(clientData.client_date_of_birth) : null;

  // Prepare initial values for the form
  const initialValues = {
    fullName,
    dateOfBirth: clientData?.client_date_of_birth || '',
    age: age !== null ? age.toString() : '',
    state: clientData?.client_state || '',
    phoneNumber: clientData?.client_phone || '',
    email: clientData?.client_email || '',
  };

  if (isLoadingClient) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Client History Form</h2>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <ClientHistoryTemplate
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={initialValues}
    />
  );
};

export default ClientHistoryTemplateWrapper;
