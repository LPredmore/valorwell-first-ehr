
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FilePlus, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PatientDocuments: React.FC = () => {
  // Non-functional buttons - intentionally does nothing
  const handleCreateTreatmentPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Treatment Plan button clicked - no action taken");
    return false;
  };

  // Non-functional buttons - intentionally does nothing
  const handleDocumentSession = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Document Session button clicked - no action taken");
    return false;
  };

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
        
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button 
                className="p-6 h-auto flex flex-col items-center justify-center gap-3 bg-white hover:bg-gray-50 text-valorwell-700 border border-gray-200"
                variant="outline"
                type="button"
                onClick={handleCreateTreatmentPlan}
              >
                <FilePlus className="h-10 w-10 text-valorwell-600" />
                <span className="text-lg font-medium">Create Treatment Plan</span>
                <span className="text-sm text-gray-500">Generate a new treatment plan document</span>
              </Button>
              
              <Button 
                className="p-6 h-auto flex flex-col items-center justify-center gap-3 bg-white hover:bg-gray-50 text-valorwell-700 border border-gray-200"
                variant="outline"
                type="button"
                onClick={handleDocumentSession}
              >
                <FileEdit className="h-10 w-10 text-valorwell-600" />
                <span className="text-lg font-medium">Document Session</span>
                <span className="text-sm text-gray-500">Record notes from a client session</span>
              </Button>
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
          </TabsContent>
          
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Document Templates</CardTitle>
                <CardDescription>Manage your document templates</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Your document templates will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientDocuments;
