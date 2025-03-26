
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';

const MyClients: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-valorwell-600" />
            <span className="text-sm text-gray-500">Manage your client relationships</span>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>View and manage your assigned clients</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your personalized client management interface will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyClients;
