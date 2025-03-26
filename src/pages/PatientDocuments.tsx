
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const PatientDocuments: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Patient Documents</h1>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-valorwell-600" />
            <span className="text-sm text-gray-500">Manage and view patient documents</span>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Document Library</CardTitle>
            <CardDescription>Access all patient forms, records, and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your patient document management interface will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientDocuments;
