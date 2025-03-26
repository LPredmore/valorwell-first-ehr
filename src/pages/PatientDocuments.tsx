
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Upload, Download, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

interface Document {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

const PatientDocuments: React.FC = () => {
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const { toast } = useToast();
  const { id: patientId } = useParams<{ id: string }>();

  // Prevent event propagation and only handle our specific function
  const handleCreateTreatmentPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Create Treatment Plan button clicked");
    setShowTreatmentPlan(true);
  };

  const handleCloseTreatmentPlan = () => {
    console.log("Closing treatment plan");
    setShowTreatmentPlan(false);
  };

  const handleSaveTreatmentPlan = async () => {
    try {
      console.log("Saving treatment plan");
      // Future implementation: Save the treatment plan
      toast({
        title: "Success",
        description: "Treatment plan created successfully",
      });
      setShowTreatmentPlan(false);
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast({
        title: "Error",
        description: "Failed to save treatment plan",
        variant: "destructive",
      });
    }
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
        
        {showTreatmentPlan ? (
          <TreatmentPlanTemplate 
            onClose={handleCloseTreatmentPlan} 
            onSave={handleSaveTreatmentPlan}
          />
        ) : (
          <Tabs defaultValue="documents">
            <TabsList className="mb-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="forms">Assessment Forms</TabsTrigger>
              <TabsTrigger value="templates">Document Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>Access all patient forms, records, and documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 mb-6">
                    <Button 
                      className="flex items-center gap-2" 
                      onClick={handleCreateTreatmentPlan}
                      type="button"
                    >
                      <FileText size={18} />
                      Create Treatment Plan
                    </Button>
                    <Button className="flex items-center gap-2">
                      <Upload size={18} />
                      Upload Document
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-gray-200 hover:border-valorwell-500 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <Folder className="h-12 w-12 text-valorwell-600 mb-2" />
                        <span className="font-medium">Treatment Plans</span>
                        <span className="text-sm text-gray-500">0 documents</span>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 hover:border-valorwell-500 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <Folder className="h-12 w-12 text-valorwell-600 mb-2" />
                        <span className="font-medium">Progress Notes</span>
                        <span className="text-sm text-gray-500">0 documents</span>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 hover:border-valorwell-500 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <Folder className="h-12 w-12 text-valorwell-600 mb-2" />
                        <span className="font-medium">Assessments</span>
                        <span className="text-sm text-gray-500">0 documents</span>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="forms">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Forms</CardTitle>
                  <CardDescription>Create and complete patient assessment forms</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Assessment forms will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Document Templates</CardTitle>
                  <CardDescription>Create and manage document templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 mb-6">
                    <Button 
                      className="flex items-center gap-2" 
                      onClick={handleCreateTreatmentPlan}
                      type="button"
                    >
                      <FileText size={18} />
                      Treatment Plan Template
                    </Button>
                    <Button className="flex items-center gap-2">
                      <FileText size={18} />
                      Progress Note Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default PatientDocuments;
