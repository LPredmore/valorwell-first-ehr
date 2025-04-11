
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, ClipboardCheck, FileText, ClipboardList, Download, Calendar, Eye, PenLine, FileX, FilePlus2 } from "lucide-react";
import TreatmentPlanTemplate from "@/components/templates/TreatmentPlanTemplate";
import SessionNoteTemplate from "@/components/templates/SessionNoteTemplate";
import PHQ9Template from "@/components/templates/PHQ9Template";
import PCL5Template from "@/components/templates/PCL5Template";
import { useClinicianData } from "@/hooks/useClinicianData";
import { ClientDetails } from "@/types/client";
import { fetchClinicalDocuments, getDocumentDownloadURL, supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";

interface DocumentationTabProps {
  clientData?: ClientDetails | null;
}

interface ClinicalDocument {
  id: string;
  document_title: string;
  document_type: string;
  document_date: string;
  file_path: string;
  created_at: string;
  created_by?: string;
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({
  clientData
}) => {
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);
  const [showPHQ9Template, setShowPHQ9Template] = useState(false);
  const [showPCL5Template, setShowPCL5Template] = useState(false);
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assignedDocuments, setAssignedDocuments] = useState<any[]>([]);
  const [isLoadingAssignedDocs, setIsLoadingAssignedDocs] = useState(false);

  const {
    clinicianData
  } = useClinicianData();
  const {
    toast
  } = useToast();
  const { userRole } = useUser();

  useEffect(() => {
    if (clientData?.id) {
      setIsLoading(true);
      fetchClinicalDocuments(clientData.id).then(docs => {
        setDocuments(docs);
        setIsLoading(false);
      }).catch(err => {
        console.error('Error fetching documents:', err);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load client documents",
          variant: "destructive"
        });
      });
      
      // In the future, we'll add actual fetching of assigned documents here
      setIsLoadingAssignedDocs(true);
      
      // Check for informed consent document
      const fetchAssignedDocuments = async () => {
        try {
          // Check if the client has completed the informed consent form
          const { data: informedConsent, error: consentError } = await supabase
            .from('clinical_documents')
            .select('*')
            .eq('client_id', clientData.id)
            .eq('document_type', 'informed_consent')
            .order('created_at', { ascending: false })
            .maybeSingle();
            
          if (consentError) throw consentError;
          
          const assignedDocs = [];
          
          // Only add the informed consent to assigned documents if it hasn't been completed
          if (!informedConsent) {
            assignedDocs.push({
              id: '2',
              title: 'Informed Consent',
              type: 'Legal',
              required: true,
              status: 'not_started'
            });
          }
          
          setAssignedDocuments(assignedDocs);
        } catch (error) {
          console.error('Error fetching assigned documents:', error);
          setAssignedDocuments([]);
        } finally {
          setIsLoadingAssignedDocs(false);
        }
      };
      
      fetchAssignedDocuments();
    }
  }, [clientData?.id, toast]);

  const handleCloseTreatmentPlan = () => {
    setShowTreatmentPlanTemplate(false);
    if (clientData?.id) {
      fetchClinicalDocuments(clientData.id).then(docs => setDocuments(docs)).catch(err => console.error('Error refreshing documents:', err));
    }
  };

  const handleCloseSessionNote = () => {
    setShowSessionNoteTemplate(false);
    if (clientData?.id) {
      fetchClinicalDocuments(clientData.id).then(docs => setDocuments(docs)).catch(err => console.error('Error refreshing documents:', err));
    }
  };

  const handleClosePHQ9 = () => {
    setShowPHQ9Template(false);
    if (clientData?.id) {
      fetchClinicalDocuments(clientData.id).then(docs => setDocuments(docs)).catch(err => console.error('Error refreshing documents:', err));
    }
  };

  const handleClosePCL5 = () => {
    setShowPCL5Template(false);
    if (clientData?.id) {
      fetchClinicalDocuments(clientData.id).then(docs => setDocuments(docs)).catch(err => console.error('Error refreshing documents:', err));
    }
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const url = await getDocumentDownloadURL(filePath);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Could not retrieve document URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive"
      });
    }
  };

  // Only show documentation creation options for clinicians and admins
  const canCreateDocumentation = userRole === 'clinician' || userRole === 'admin';

  return <div className="grid grid-cols-1 gap-6">
      {canCreateDocumentation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-valorwell-600" />
              Enter Documentation
            </CardTitle>
            <CardDescription>Create documentation for this client</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => setShowTreatmentPlanTemplate(true)}
            >
              <FileText className="h-4 w-4" />
              Treatment Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New section: Assigned Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-valorwell-600" />
            Assigned Documents
          </CardTitle>
          <CardDescription>Forms and documents that need your attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAssignedDocs ? (
            <div className="flex justify-center py-8">
              <p>Loading assigned documents...</p>
            </div>
          ) : assignedDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileX className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No documents assigned</h3>
              <p className="text-sm text-gray-500 mt-1">
                There are currently no forms or documents assigned to this client
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.required ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${doc.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          doc.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                          {doc.status === 'completed' ? 'Completed' : 
                           doc.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.status === 'completed' ? (
                          <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.filePath)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        ) : (
                          <Button variant="default" size="sm">
                            Fill Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-valorwell-600" />
            Assigned Forms
          </CardTitle>
          <CardDescription>View and complete patient assessments</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          {/* Assessment content */}
        </CardContent>
      </Card>

      {showTreatmentPlanTemplate && <div className="animate-fade-in">
          <TreatmentPlanTemplate onClose={handleCloseTreatmentPlan} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>}

      {showSessionNoteTemplate && <div className="animate-fade-in">
          <SessionNoteTemplate onClose={handleCloseSessionNote} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>}

      {showPHQ9Template && <div className="animate-fade-in">
          <PHQ9Template onClose={handleClosePHQ9} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>}
      
      {showPCL5Template && <div className="animate-fade-in">
          <PCL5Template onClose={handleClosePCL5} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-valorwell-600" />
            Completed Notes
          </CardTitle>
          <CardDescription>View completed session notes and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8">
              <p>Loading documents...</p>
            </div> : documents.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create a treatment plan or session note to view it here
              </p>
            </div> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.document_title}</TableCell>
                      <TableCell>{doc.document_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {format(new Date(doc.document_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="ml-2" onClick={() => handleViewDocument(doc.file_path)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </CardContent>
      </Card>
    </div>;
};

export default DocumentationTab;
