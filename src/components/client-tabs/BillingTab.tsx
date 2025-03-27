
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BillingTabProps {
  clientData?: any;
}

const BillingTab: React.FC<BillingTabProps> = ({ clientData }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>Manage client billing and insurance details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Insurance Information</h3>
            
            {/* Primary Insurance */}
            <div className="border p-4 rounded-md">
              <h4 className="font-medium mb-2">Primary Insurance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Insurance Company</p>
                  <p>{clientData?.client_insurance_company_primary || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Insurance Type</p>
                  <p>{clientData?.client_insurance_type_primary || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Policy Number</p>
                  <p>{clientData?.client_policy_number_primary || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Group Number</p>
                  <p>{clientData?.client_group_number_primary || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            {/* Secondary Insurance (if provided) */}
            {clientData?.client_insurance_company_secondary && (
              <div className="border p-4 rounded-md">
                <h4 className="font-medium mb-2">Secondary Insurance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Insurance Company</p>
                    <p>{clientData?.client_insurance_company_secondary || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Insurance Type</p>
                    <p>{clientData?.client_insurance_type_secondary || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p>{clientData?.client_policy_number_secondary || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Group Number</p>
                    <p>{clientData?.client_group_number_secondary || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;
