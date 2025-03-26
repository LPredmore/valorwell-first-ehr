
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

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
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
            <TabsTrigger value="session">Session Notes</TabsTrigger>
            <TabsTrigger value="forms">Intake Forms</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>Access all patient forms, records, and documents</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Create Treatment Plan button clicked - no action taken");
                    }}
                  >
                    Create Treatment Plan
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Document Session button clicked - no action taken");
                    }}
                  >
                    Document Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>Your document library will be displayed here. You can search, filter, and organize patient documents.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="treatment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Plans</CardTitle>
                <CardDescription>View and manage treatment plans for patients</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Treatment plans will be displayed here once they are created.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="session" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
                <CardDescription>View and manage session notes for patients</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Session notes will be displayed here once they are created.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Intake Forms</CardTitle>
                <CardDescription>View and manage intake forms for patients</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Intake forms will be displayed here once they are created.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientDocuments;
