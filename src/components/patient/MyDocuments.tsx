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
  title: string;
  type: string;
  required: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
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
        
        const assignedDocs: AssignedDocument[] = [
          {
            id: '1',
            title: 'Client History Form',
            type: 'Intake',
            required: true,
            status: clientHistory?.pdf_path ? 'completed' : 'not_started',
            filePath: clientHistory?.pdf_path || undefined,
            route: clientHistory?.pdf_path ? undefined : '/client-history-form'
          },
          {
            id: '2',
            title: 'Informed Consent',
            type: 'Legal',
            required: true,
            status: 'not_started'
          },
        ];
        
        if (assignments && assignments.length > 0) {
          assignments.forEach(assignment => {
            const docIndex = assignedDocs.findIndex(doc => doc.id === assignment.document_id);
            if (docIndex >= 0) {
              assignedDocs[docIndex].status = assignment.status as 'not_started' | 'in_progress' | 'completed';
              if (assignment.pdf_url) {
                assignedDocs[docIndex].filePath = assignment.pdf_url;
              }
            }
          });
        }
        
        setAssignedDocuments(assignedDocs);
      } catch (error) {
        console.error('Error fetching document assignments:', error);
        setAssignedDocuments([
          {
            id: '1',
            title: 'Client History Form',
            type: 'Intake',
            required: true,
            status: 'not_started',
            route: '/client-history-form'
          },
          {
            id: '2',
            title: 'Informed Consent',
            type: 'Legal',
            required: true,
            status: 'not_started'
          },
        ]);
      } finally {
        setIsLoadingAssignedDocs(false);
      }
    };

    loadDocuments();
  }, [userId, toast]);

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

  const handleFillOutForm = (doc: AssignedDocument) => {
    if (doc.route) {
      navigate(doc.route);
    } else {
      toast({
        title: "Coming Soon",
        description: "This form will be available soon.",
      });
    }
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
            Completed Documents
          </CardTitle>
          <CardDescription>Your completed forms and clinical documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-sm text-gray-500 mt-1">
                You don't have any completed documents yet
              </p>
            </div>
          ) : (
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
                  {documents.map(doc => (
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
                        <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.file_path)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDocuments;
