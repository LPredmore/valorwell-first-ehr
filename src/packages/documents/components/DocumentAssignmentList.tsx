
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye, FileX, CheckCircle2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { getDocumentDownloadURL } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentAssignment {
  id: string;
  document_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  pdf_url?: string;
  route?: string;
}

interface DocumentAssignmentListProps {
  assignments: DocumentAssignment[];
  isLoading?: boolean;
  onFillOut?: (assignment: DocumentAssignment) => void;
}

export const DocumentAssignmentList: React.FC<DocumentAssignmentListProps> = ({
  assignments,
  isLoading = false,
  onFillOut
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleViewDocument = async (pdfUrl: string) => {
    try {
      const url = await getDocumentDownloadURL(pdfUrl);
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

  const handleFillOutForm = (assignment: DocumentAssignment) => {
    if (onFillOut) {
      onFillOut(assignment);
      return;
    }

    if (assignment.route) {
      navigate(assignment.route);
    } else {
      toast({
        title: "Coming Soon",
        description: "This form will be available soon."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading assigned documents...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
        <h3 className="text-lg font-medium">Great job! You're all caught up.</h3>
        <p className="text-sm text-gray-500 mt-1">
          There are currently no forms or documents assigned to you
        </p>
      </div>
    );
  }
  
  return (
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
          {assignments.map(assignment => (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">{assignment.document_name}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'}`}>
                  {assignment.status === 'completed' ? 'Completed' : 
                   assignment.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </span>
              </TableCell>
              <TableCell>{format(new Date(assignment.created_at), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-right">
                {assignment.status === 'completed' && assignment.pdf_url ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDocument(assignment.pdf_url!)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleFillOutForm(assignment)}
                  >
                    Fill Out
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
