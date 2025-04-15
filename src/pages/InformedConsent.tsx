
import React from 'react';
import InformedConsentTemplate from '@/components/templates/InformedConsentTemplate';
import { useClientData } from '@/hooks/useClientData';

const InformedConsent: React.FC = () => {
  const { clientData } = useClientData();

  return (
    <div className="container mx-auto py-6">
      <InformedConsentTemplate clientData={clientData} />
    </div>
  );
};

export default InformedConsent;
