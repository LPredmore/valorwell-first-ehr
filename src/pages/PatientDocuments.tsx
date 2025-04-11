
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
  const { userId } = useUser();

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
            <CardTitle>Document Library</CardTitle>
            <CardDescription>Access all patient forms, records, and documents</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileX className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium">No documents found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No documents have been created for your account yet
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-2" 
                            onClick={() => handleViewDocument(doc.file_path)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientDocuments;
