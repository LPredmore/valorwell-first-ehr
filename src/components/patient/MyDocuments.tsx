
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MyDocuments: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>View and download your documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-center text-gray-500">Your documents will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyDocuments;
