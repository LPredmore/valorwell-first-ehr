
import React, { useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useClientData } from '@/hooks/useClientData';
import { useClientHistorySubmission } from '@/features/clientHistory/hooks/useClientHistorySubmission';
import ClientHistoryForm from '@/features/clientHistory/components/ClientHistoryForm';
import { ClientHistoryFormData } from '@/features/clientHistory/types';

const ClientHistoryFormPage: React.FC = () => {
  const { userId } = useUser();
  const formRef = useRef<HTMLDivElement>(null);
  
  // Fetch client data using our custom hook
  const { clientData, loading } = useClientData(userId);
  
  // Use our submission hook for form handling
  const { isSubmitting, submitClientHistory } = useClientHistorySubmission({ userId });
  
  const handleSubmit = async (formData: ClientHistoryFormData) => {
    if (!formRef.current) {
      console.error("Form reference not available");
      return;
    }
    
    await submitClientHistory(formData);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading client information...</div>;
  }
  
  return (
    <div ref={formRef} id="client-history-form">
      <ClientHistoryForm 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        clientData={clientData}
      />
    </div>
  );
};

export default ClientHistoryFormPage;
