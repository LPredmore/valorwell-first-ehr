
import React from 'react';
import Layout from '@/components/layout/Layout';
import { MyPortal } from '../components';
import { useClientData } from '@/packages/core/hooks/useClientData';
import { useUser } from '@/packages/auth/contexts/UserContext';

const PatientDashboard: React.FC = () => {
  const { userId } = useUser();
  const { clientData, isLoading, error } = useClientData(userId);

  if (isLoading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div>Error: {error.message}</div></Layout>;
  }

  // Create a clinician name from available data
  const clinicianName = clientData?.client_assigned_therapist 
    ? `${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`.trim() || 'Your Therapist' 
    : 'Your Therapist';

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <MyPortal 
          clientData={clientData} 
          clinicianName={clinicianName} 
          loading={isLoading}
          upcomingAppointments={[]}
        />
      </div>
    </Layout>
  );
};

export default PatientDashboard;
