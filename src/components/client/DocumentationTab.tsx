import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { timeAgo } from '@/utils/dateUtils';
import { FileText, Download, FileCheck, AlertCircle, FileX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Define the ClinicalDocument type
interface ClinicalDocument {
  id: string;
  document_title: string;
  document_type: string;
  document_date: string;
  file_path: string;
  created_at: string;
}

interface DocumentationTabProps {
  clientId: string;
}

export default function DocumentationTab({ clientId }: DocumentationTabProps) {
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchDocuments();
    }
  }, [clientId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('clinical_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('document_date', { ascending: false });

      if (error) {
        throw error;
      }

      // Type safety: ensure the data matches our expected format
      const typedData: ClinicalDocument[] = data as ClinicalDocument[];
      setDocuments(typedData);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Error loading documents');
      toast({
        title: "Error Loading Documents",
        description: "There was a problem loading your documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (filePath: string, documentTitle: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('clinical-documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a URL for the blob
      const url = URL.createObjectURL(data);
      
      // Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = documentTitle || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL to free up memory
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading document:', err);
      toast({
        title: "Download Failed",
        description: err.message || "Could not download the document.",
        variant: "destructive",
      });
    }
  };

  // Filter documents by type for display
  const clinicalNotes = documents.filter(doc => doc.document_type === 'clinical_note');
  const assessments = documents.filter(doc => doc.document_type === 'assessment');
  const treatmentPlans = documents.filter(doc => doc.document_type === 'treatment_plan');
  const informedConsent = documents.filter(doc => doc.document_type === 'informed_consent');
  const otherDocuments = documents.filter(doc => 
    !['clinical_note', 'assessment', 'treatment_plan', 'informed_consent'].includes(doc.document_type)
  );

  if (isLoading) {
    return <DocumentationSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <div>
          <h3 className="font-medium text-red-800">Error Loading Documents</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-12 border border-dashed rounded-lg">
        <FileX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Documents Available</h3>
        <p className="text-gray-500">No clinical documents have been uploaded for this client yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Clinical Notes Section */}
      {renderDocumentSection('Clinical Notes', clinicalNotes)}
      
      {/* Assessments Section */}
      {renderDocumentSection('Assessments', assessments)}
      
      {/* Treatment Plans Section */}
      {renderDocumentSection('Treatment Plans', treatmentPlans)}
      
      {/* Informed Consent Section */}
      {renderDocumentSection('Informed Consent', informedConsent)}
      
      {/* Other Documents Section */}
      {otherDocuments.length > 0 && renderDocumentSection('Other Documents', otherDocuments)}
    </div>
  );

  function renderDocumentSection(title: string, docs: ClinicalDocument[]) {
    if (docs.length === 0) return null;
    
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <DocumentCard 
              key={doc.id} 
              document={doc} 
              onDownload={() => handleDownload(doc.file_path, doc.document_title)} 
            />
          ))}
        </div>
      </div>
    );
  }
}

interface DocumentCardProps {
  document: ClinicalDocument;
  onDownload: () => void;
}

function DocumentCard({ document, onDownload }: DocumentCardProps) {
  const dateFormatted = new Date(document.document_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">{document.document_title}</CardTitle>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {document.document_type.replace('_', ' ')}
          </span>
        </div>
        <CardDescription className="text-xs">{dateFormatted}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 text-xs">
        <p>Uploaded {timeAgo(document.created_at)}</p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={onDownload}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}

function DocumentationSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
