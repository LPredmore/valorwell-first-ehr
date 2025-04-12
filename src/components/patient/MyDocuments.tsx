import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, FileText, FileX, FilePlus2 } from 'lucide-react';
import { format } from 'date-fns';
import { fetchClinicalDocuments, getDocumentDownloadURL, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  document_title: string;
  document_type: string;
  document_date: string;
  file_path: string;
  created_at: string;
}

interface AssignedDocument {
  id: string;
  document_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  filePath?: string;
  route?: string;
}

const MyDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedDocuments, setAssignedDocuments] = useState<AssignedDocument[]>([]);
  const [isLoadingAssignedDocs, setIsLoadingAssignedDocs] = useState(false);
  
  const { toast } = useToast();
  const { userId } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDocuments = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const docs = await fetchClinicalDocuments(userId);
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Error",
          description: "Failed to load your documents",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
      
      setIsLoadingAssignedDocs(true);
      try {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('document_assignments')
          .select('*')
          .eq('client_id', userId);
          
        if (assignmentsError) throw assignmentsError;
        
        const { data: clientHistory, error: historyError } = await supabase
          .from('client_history')
          .select('pdf_path')
          .eq('client_id', userId)
          .maybeSingle();
          
        if (historyError) throw historyError;

        const { data: informedConsent, error: consentError } = await supabase
          .from('clinical_documents')
          .select('file_path')
          .eq('client_id', userId)
          .eq('document_type', 'informed_consent')
          .order('created_at', { ascending: false })
          .maybeSingle();
          
        if (consentError) console.error('Error fetching informed consent:', consentError);
        
        const assignedDocs: AssignedDocument[] = [
          {
            id: '1',
            document_name: 'Client History Form',
            status: clientHistory?.pdf_path ? 'completed' : 'not_started',
            created_at: new Date().toISOString(),
            filePath: clientHistory?.pdf_path || undefined,
            route: clientHistory?.pdf_path ? undefined : '/client-history-form'
          }, 
          {
            id: '2',
            document_name: 'Informed Consent',
            status: informedConsent?.file_path ? 'completed' : 'not_started',
            created_at: new Date().toISOString(),
            filePath: informedConsent?.file_path || undefined,
            route: informedConsent?.file_path ? undefined : '/informed-consent'
          }
        ];
        
        if (assignments && assignments.length > 0) {
          assignments.forEach(assignment => {
            const existingIndex = assignedDocs.findIndex(doc => 
              doc.document_name.toLowerCase() === assignment.document_name.toLowerCase()
            );
            
            if (existingIndex >= 0) {
              assignedDocs[existingIndex].status = assignment.status as 'not_started' | 'in_progress' | 'completed';
              if (assignment.pdf_url) {
                assignedDocs[existingIndex].filePath = assignment.pdf_url;
              }
            } else {
              assignedDocs.push({
                id: assignment.id,
                document_name: assignment.document_name,
                status: (assignment.status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
                created_at: assignment.created_at,
                filePath: assignment.pdf_url
              });
            }
          });
        }
        
        setAssignedDocuments(assignedDocs);
      } catch (error) {
        console.error('Error fetching document assignments:', error);
        setAssignedDocuments([
          {
            id: '1',
            document_name: 'Client History Form',
            status: 'not_started',
            created_at: new Date().toISOString(),
            route: '/client-history-form'
          }, 
          {
            id: '2',
            document_name: 'Informed Consent',
            status: 'not_started',
            created_at: new Date().toISOString(),
            route: '/informed-consent'
          }
        ]);
      } finally {
        setIsLoadingAssignedDocs(false);
      }
    };
    
    loadDocuments();
  }, [userId, toast]);

  const handleViewDocument = async (filePath: string, documentType?: string) => {
    try {
      const url = await getDocumentDownloadURL(filePath, documentType);
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

  const handleFillOutForm = (doc: AssignedDocument) => {
    if (doc.route) {
      navigate(doc.route);
    } else {
      toast({
        title: "Coming Soon",
        description: "This form will be available soon."
      });
    }
  };

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

  const renderDocumentsTable = (docs: Document[], emptyMessage: string) => {
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
                  <Button variant="outline" size="sm" className="ml-2" onClick={() => handleViewDocument(doc.file_path, doc.document_type)}>
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

  return (
    <div className="grid grid-cols-1 gap-6">
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
                There are currently no forms or documents assigned to you
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedDocuments.map(doc => (
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
                      <TableCell className="text-right">
                        {doc.status === 'completed' ? (
                          <Button variant="outline" size="sm" onClick={() => doc.filePath && handleViewDocument(doc.filePath)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        ) : (
                          <Button variant="default" size="sm" onClick={() => handleFillOutForm(doc)}>
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
            <FileText className="h-5 w-5 text-valorwell-600" />
            Clinical Notes
          </CardTitle>
          <CardDescription>View your treatment plans and session notes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading clinical notes...</p>
            </div>
          ) : (
            renderDocumentsTable(
              getClinicalNotes(), 
              "No clinical notes have been created for your account yet"
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
          <CardDescription>View your completed assessment forms and other documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading completed forms...</p>
            </div>
          ) : (
            renderDocumentsTable(
              getCompletedForms(), 
              "No completed forms have been found for your account yet"
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDocuments;
