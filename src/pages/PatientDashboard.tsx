
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';

const PatientDashboard: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Patient Dashboard</h1>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-valorwell-600" />
            <span className="text-sm text-gray-500">Comprehensive patient overview</span>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Patient Overview</CardTitle>
            <CardDescription>Monitor patient status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The patient dashboard with key metrics and information will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientDashboard;
