import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, ClipboardCheck, FileText, Calendar, 
  Eye, PenLine, FileX, FilePlus2, Plus, ChevronDown
} from "lucide-react";
import TreatmentPlanTemplate from "@/components/templates/TreatmentPlanTemplate";
import SessionNoteTemplate from "@/components/templates/SessionNoteTemplate";
import PHQ9Template from "@/components/templates/PHQ9Template";
import PCL5Template from "@/components/templates/PCL5Template";
import { useClinicianData } from "@/hooks/useClinicianData";
import { ClientDetails } from "@/packages/core/types/client/details";
import { fetchClinicalDocuments, getDocumentDownloadURL, supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface AssignableTemplate {
  id: string;
  template_id: string;
  template_name: string;
  template_type: string;
  is_assignable: boolean;
}

interface DocumentAssignment {
  id: string;
  document_name: string;
  assigned_by?: string;
  status?: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
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
  const [assignedDocuments, setAssignedDocuments] = useState<DocumentAssignment[]>([]);
  const [isLoadingAssignedDocs, setIsLoadingAssignedDocs] = useState(false);
  const [assignableTemplates, setAssignableTemplates] = useState<AssignableTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const { clinicianData } = useClinicianData();
  const { toast } = useToast();
  const { userRole, userId } = useUser();

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
      
      setIsLoadingAssignedDocs(true);
      
      const fetchAssignedDocuments = async () => {
        try {
          const { data, error } = await supabase
            .from('document_assignments')
            .select('*')
            .eq('client_id', clientData.id);
            
          if (error) throw error;
          
          const { data: informedConsent, error: consentError } = await supabase
            .from('clinical_documents')
            .select('*')
            .eq('client_id', clientData.id)
            .eq('document_type', 'informed_consent')
            .order('created_at', { ascending: false })
            .maybeSingle();
            
          if (consentError) console.error('Error fetching informed consent:', consentError);
          
          let assignmentsList = data || [];
          
          if (!informedConsent) {
            assignmentsList = [...assignmentsList, {
              id: 'informed-consent',
              document_name: 'Informed Consent',
              client_id: clientData.id,
              status: 'not_started',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }];
          }
          
          setAssignedDocuments(assignmentsList);
        } catch (error) {
          console.error('Error fetching assigned documents:', error);
          setAssignedDocuments([]);
        } finally {
          setIsLoadingAssignedDocs(false);
        }
      };
      
      fetchAssignedDocuments();
      
      if (userRole === 'clinician' || userRole === 'admin') {
        setIsLoadingTemplates(true);
        supabase
          .from('template_settings')
          .select('*')
          .eq('is_assignable', true)
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching assignable templates:', error);
              toast({
                title: "Error",
                description: "Failed to load assignable templates",
                variant: "destructive"
              });
            } else {
              setAssignableTemplates(data || []);
            }
            setIsLoadingTemplates(false);
          });
      }
    }
  }, [clientData?.id, toast, userRole]);

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

  const handleAssignDocument = async (templateId: string, templateName: string) => {
    if (!clientData?.id || !userId) {
      toast({
        title: "Error",
        description: "Client information is missing",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const assignment = {
        document_name: templateName,
        client_id: clientData.id,
        assigned_by: userId,
        status: 'not_started'
      };
      
      const { error } = await supabase
        .from('document_assignments')
        .insert([assignment]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${templateName} has been assigned to the client`
      });
      
      const { data: updatedData, error: fetchError } = await supabase
        .from('document_assignments')
        .select('*')
        .eq('client_id', clientData.id);
        
      if (fetchError) throw fetchError;
      
      setAssignedDocuments(updatedData || []);
      
    } catch (error) {
      console.error('Error assigning document:', error);
      toast({
        title: "Error",
        description: "Failed to assign document to client",
        variant: "destructive"
      });
    }
  };

  const canCreateDocumentation = userRole === 'clinician' || userRole === 'admin';
  const canAssignDocuments = userRole === 'clinician' || userRole === 'admin';

  const getClinicalNotes = () => {
    return documents.filter(doc => 
      doc.document_type === 'treatment_plan' || 
      doc.document_type === 'session_note'
    );
  };

  const getCompletedForms = () => {
    return documents.filter(doc => 
      doc.document_type !== 'treatment_plan' && 
      doc.document_type !== 'session_note'
    );
  };

  const renderDocumentsTable = (docs: ClinicalDocument[], emptyMessage: string) => {
    if (docs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
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
            {docs.map(doc => (
              <TableRow key={doc.id}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FilePlus2 className="h-5 w-5 text-valorwell-600" />
              Assigned Documents
            </CardTitle>
            <CardDescription>Forms and documents that need client's attention</CardDescription>
          </div>
          {canAssignDocuments && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> 
                  Assign New Document
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                {isLoadingTemplates ? (
                  <DropdownMenuItem disabled>Loading templates...</DropdownMenuItem>
                ) : assignableTemplates.length > 0 ? (
                  assignableTemplates.map(template => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => handleAssignDocument(template.template_id, template.template_name)}
                    >
                      {template.template_name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No assignable templates available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
                    <TableHead>Status</TableHead>
                    <TableHead>Date Assigned</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.document_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${doc.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          doc.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                          {doc.status === 'completed' ? 'Completed' : 
                           doc.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(doc.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        {doc.status === 'completed' && doc.pdf_url ? (
                          <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.pdf_url!)}>
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

      {showTreatmentPlanTemplate && (
        <div className="animate-fade-in">
          <TreatmentPlanTemplate 
            onClose={handleCloseTreatmentPlan} 
            clinicianName={clinicianData?.clinician_professional_name || ''} 
            clientData={clientData} 
          />
        </div>
      )}

      {showSessionNoteTemplate && (
        <div className="animate-fade-in">
          <SessionNoteTemplate onClose={handleCloseSessionNote} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>
      )}

      {showPHQ9Template && (
        <div className="animate-fade-in">
          <PHQ9Template onClose={handleClosePHQ9} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>
      )}
      
      {showPCL5Template && (
        <div className="animate-fade-in">
          <PCL5Template onClose={handleClosePCL5} clinicianName={clinicianData?.clinician_professional_name || ''} clientData={clientData} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-valorwell-600" />
            Clinical Notes
          </CardTitle>
          <CardDescription>View completed treatment plans and session notes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading clinical notes...</p>
            </div>
          ) : (
            renderDocumentsTable(
              getClinicalNotes(), 
              "No clinical notes have been created for this client yet"
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-valorwell-600" />
            Completed Forms
          </CardTitle>
          <CardDescription>View completed assessment forms and other documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading completed forms...</p>
            </div>
          ) : (
            renderDocumentsTable(
              getCompletedForms(), 
              "No completed assessment forms have been found for this client yet"
            )
          )}
        </CardContent>
      </Card>
    </div>;
};

export default DocumentationTab;
