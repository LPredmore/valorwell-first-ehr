
import React from 'react';
import InformedConsentTemplate from '@/components/templates/InformedConsentTemplate';
import { useClientData } from '@/hooks/useClientData';
import { useUser } from '@/context/UserContext';

const InformedConsent: React.FC = () => {
  const { userId } = useUser();
  const { clientData } = useClientData(userId);

  return (
    <div className="container mx-auto py-6">
      <InformedConsentTemplate clientData={clientData} />
    </div>
  );
};

export default InformedConsent;
