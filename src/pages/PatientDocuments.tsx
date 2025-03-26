
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';

const PatientDocuments: React.FC = () => {
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);

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
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>Access all patient forms, records, and documents</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div 
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Create Treatment Plan button clicked - no action taken");
                    }}
                  >
                    Create Treatment Plan
                  </div>
                  <div 
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Document Session button clicked - no action taken");
                    }}
                  >
                    Document Session
                  </div>
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
          
          <TabsContent value="documentation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentation Templates</CardTitle>
                <CardDescription>View and use documentation templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Treatment Plan</CardTitle>
                      <CardDescription>Standard documentation for treatment plans</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-500 mb-4">
                        A comprehensive form for documenting patient treatment plans including goals, interventions, and progress tracking.
                      </p>
                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTreatmentPlanTemplate(true);
                        }}
                      >
                        View Template
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Session Note</CardTitle>
                      <CardDescription>Standard documentation for therapy sessions</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-500 mb-4">
                        A standardized form for documenting patient sessions, including session focus, interventions, and progress notes.
                      </p>
                      <Button 
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowSessionNoteTemplate(true);
                        }}
                      >
                        View Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {showTreatmentPlanTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Treatment Plan Template</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTreatmentPlanTemplate(false)}
              >
                Close
              </Button>
            </div>
            <div className="p-6">
              <TreatmentPlanTemplate onClose={() => setShowTreatmentPlanTemplate(false)} />
            </div>
          </div>
        </div>
      )}
      
      {showSessionNoteTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Session Note Template</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionNoteTemplate(false)}
              >
                Close
              </Button>
            </div>
            <div className="p-6">
              <SessionNoteTemplate onClose={() => setShowSessionNoteTemplate(false)} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PatientDocuments;
