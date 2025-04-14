
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, FileText, FileX } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { fetchClinicalDocuments, getDocumentDownloadURL } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';

interface Document {
  id: string;
  document_title: string;
  document_type: string;
  document_date: string;
  file_path: string;
  created_at: string;
}

const PatientDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userId, userRole } = useUser();

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
    };
    loadDocuments();
  }, [userId, toast]);

  const handleViewDocument = async (filePath: string, documentType: string) => {
    try {
      // Pass the document type to determine which bucket to use
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

  // Helper function to filter clinical notes (treatment plans and session notes)
  const getClinicalNotes = () => {
    return documents.filter(doc => 
      doc.document_type === 'treatment_plan' || 
      doc.document_type === 'session_note'
    );
  };

  // Helper function to filter other completed forms/documents
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
          <FileX className="h-12 w-12 text-gray-300 mb-3" />
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2" 
                    onClick={() => handleViewDocument(doc.file_path, doc.document_type)}
                  >
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
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Patient Documents</h1>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-valorwell-600" />
            <span className="text-sm text-gray-500">Manage and view patient documents</span>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Clinical Notes</CardTitle>
            <CardDescription>Treatment plans and session notes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading documents...</p>
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
            <CardTitle>Completed Forms</CardTitle>
            <CardDescription>Assessment forms and other documentation</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading documents...</p>
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
    </Layout>
  );
};

export default PatientDocuments;
