
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye, FileText, FileX } from "lucide-react";
import { getDocumentDownloadURL } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  document_title: string;
  document_type: string;
  document_date: string;
  file_path: string;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  emptyMessage: string;
  isLoading?: boolean;
  onViewDocument?: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  emptyMessage,
  isLoading = false,
  onViewDocument
}) => {
  const { toast } = useToast();

  const handleViewDocument = async (document: Document) => {
    if (onViewDocument) {
      onViewDocument(document);
      return;
    }

    try {
      const url = await getDocumentDownloadURL(document.file_path, document.document_type);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
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
          {documents.map(doc => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.document_title}</TableCell>
              <TableCell>{doc.document_type}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-gray-500" />
                  {format(new Date(doc.document_date), 'MMM d, yyyy')}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => handleViewDocument(doc)}
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
