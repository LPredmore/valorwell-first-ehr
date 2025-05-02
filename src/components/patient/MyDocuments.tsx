
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const MyDocuments: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_assignments')
        .select('*')
        .eq('client_id', userId);

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch documents',
          variant: 'destructive',
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error in fetching documents:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const docSubmit = async (documentName: string) => {
    if (!navigate || !userId) return;

    try {
      // Update the document status
      const { data, error } = await supabase
        .from('document_assignments')
        .update({ status: 'completed' })
        .eq('client_id', userId)
        .eq('document_name', documentName);

      if (error) {
        console.error('Error updating document status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update document status',
          variant: 'destructive',
        });
        return;
      }

      // Refresh document list
      fetchDocuments();
      
      toast({
        title: 'Success',
        description: 'Document submitted successfully',
      });
    } catch (error) {
      console.error('Error in document submission:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Documents</h2>
      {isLoading ? (
        <p>Loading documents...</p>
      ) : (
        <div className="container mx-auto">
          <Table>
            <TableCaption>A list of documents assigned to you.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.document_name}>
                  <TableCell className="font-medium">{document.document_name}</TableCell>
                  <TableCell>{document.description}</TableCell>
                  <TableCell>{document.status}</TableCell>
                  <TableCell className="text-right">
                    {document.status !== 'completed' ? (
                      <Button onClick={() => docSubmit(document.document_name)}>Submit</Button>
                    ) : (
                      <span>Completed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
