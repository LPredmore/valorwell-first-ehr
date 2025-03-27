
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileTabProps {
  clientData?: any;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ clientData }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {clientData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1">{clientData.client_first_name} {clientData.client_last_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                  <p className="mt-1">{clientData.client_date_of_birth || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{clientData.client_email || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1">{clientData.client_phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">{clientData.client_status || 'Unknown'}</p>
              </div>
            </div>
          ) : (
            <p>Loading client information...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
