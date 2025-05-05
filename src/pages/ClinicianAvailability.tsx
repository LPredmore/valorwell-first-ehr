
import React from 'react';
import Layout from '../components/layout/Layout';
import { useParams } from 'react-router-dom';
import { useClinicianData } from '@/hooks/useClinicianData';
import ClinicianAvailabilityManager from '@/components/settings/ClinicianAvailabilityManager';

const ClinicianAvailability = () => {
  const { clinicianId } = useParams<{ clinicianId: string }>();
  const { clinicianData, loading, error } = useClinicianData(clinicianId);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading clinician data...</div>
      </Layout>
    );
  }

  if (error || !clinicianData) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-md">
            <h3 className="text-lg font-medium">Error Loading Clinician</h3>
            <p className="text-sm">Failed to load clinician data. Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {clinicianData.clinician_first_name} {clinicianData.clinician_last_name} - Availability
          </h1>
          <p className="text-gray-600">
            Set your regular working hours for each day of the week.
          </p>
        </div>

        <ClinicianAvailabilityManager clinicianId={clinicianId || ''} />
      </div>
    </Layout>
  );
};

export default ClinicianAvailability;
