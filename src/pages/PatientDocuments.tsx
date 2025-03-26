
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileCheck, ClipboardCheck, BarChart3, FileSpreadsheet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const PatientDocuments: React.FC = () => {
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);

  const handleCloseTreatmentPlan = () => {
    setShowTreatmentPlanTemplate(false);
  };

  const handleCloseSessionNote = () => {
    setShowSessionNoteTemplate(false);
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
        
        <Tabs defaultValue="document-library" className="w-full">
          <TabsList className="mb-6 w-full justify-start border-b pb-0 pt-0">
            <TabsTrigger value="document-library" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <FileText className="h-4 w-4" />
              Document Library
            </TabsTrigger>
            <TabsTrigger value="documentation" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <FileSpreadsheet className="h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <ClipboardCheck className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="document-library" className="mt-0">
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

          <TabsContent value="documentation" className="mt-0">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-valorwell-600" />
                    Charting
                  </CardTitle>
                  <CardDescription>View and manage patient charts and progress tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-md text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium mb-2">No Charts Available</h3>
                    <p className="text-sm text-gray-500 mb-4">Charts and progress tracking will be displayed here</p>
                    <Button variant="outline">Create New Chart</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-valorwell-600" />
                    Assessments
                  </CardTitle>
                  <CardDescription>View and complete patient assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-md text-center">
                    <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium mb-2">No Assessments Available</h3>
                    <p className="text-sm text-gray-500 mb-4">Patient assessments will be displayed here</p>
                    <Button variant="outline">Create New Assessment</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-valorwell-600" />
                    Completed Notes
                  </CardTitle>
                  <CardDescription>View completed session notes and documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-md text-center">
                    <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium mb-2">No Completed Notes</h3>
                    <p className="text-sm text-gray-500 mb-4">Completed session notes will be displayed here</p>
                    <Button variant="outline">View All Notes</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Document Templates</CardTitle>
                <CardDescription>Access and manage document templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Treatment Plan Template</h3>
                    <p className="text-sm text-gray-500 mb-4">Standardized template for creating treatment plans</p>
                    <Button onClick={() => setShowTreatmentPlanTemplate(true)}>
                      View Treatment Plan Template
                    </Button>
                    {showTreatmentPlanTemplate && (
                      <TreatmentPlanTemplate onClose={handleCloseTreatmentPlan} />
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Session Note Template</h3>
                    <p className="text-sm text-gray-500 mb-4">Standardized template for creating session notes</p>
                    <Button onClick={() => setShowSessionNoteTemplate(true)}>
                      View Session Note Template
                    </Button>
                    {showSessionNoteTemplate && (
                      <SessionNoteTemplate onClose={handleCloseSessionNote} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientDocuments;
