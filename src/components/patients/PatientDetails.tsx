
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PatientDetailsProps {
  patient: any; // Use proper type when available
}

export const PatientDetails: React.FC<PatientDetailsProps> = ({ patient }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic information about the patient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p>{patient.client_email || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
              <p>{patient.client_phone || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
              <p>{patient.client_date_of_birth || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Gender</h4>
              <p>{patient.client_gender || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Time Zone</h4>
              <p>{patient.client_time_zone || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <p>{patient.client_status || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Clinical details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Self Goal</h4>
              <p>{patient.client_self_goal || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Referral Source</h4>
              <p>{patient.client_referral_source || 'Not provided'}</p>
            </div>
            {patient.client_diagnosis && patient.client_diagnosis.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Diagnosis</h4>
                <ul className="list-disc pl-5">
                  {patient.client_diagnosis.map((diagnosis: string, index: number) => (
                    <li key={index}>{diagnosis}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDetails;
