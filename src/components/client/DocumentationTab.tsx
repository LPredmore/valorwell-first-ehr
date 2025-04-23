import React, { useState, useEffect } from 'react';
import { supabase, fetchClinicalDocuments, getDocumentDownloadURL } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import PHQ9Template from '@/components/templates/PHQ9Template';
import { formatTimeZoneDisplay, formatTimeInUserTimeZone, ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { getUserTimeZoneById } from '@/hooks/useUserTimeZone';
import { Loader2 } from 'lucide-react';

interface DocumentationTabProps {
  clientData: any;
  clinicianName: string;
  selectedAppointment: any;
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ clientData, clinicianName, selectedAppointment }) => {
  const [clinicalDocuments, setClinicalDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null);
  const [showPHQ9, setShowPHQ9] = useState(false);
  const [userTimeZone, setUserTimeZone] = useState('America/New_York');
  const [loadingTimeZone, setLoadingTimeZone] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocuments = async () => {
      if (clientData?.id) {
        setLoading(true);
        try {
          const documents = await fetchClinicalDocuments(clientData.id);
          setClinicalDocuments(documents);
        } catch (error) {
          console.error('Error fetching clinical documents:', error);
          toast({
            title: "Error",
            description: "Failed to load clinical documents.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDocuments();
  }, [clientData, toast]);

  useEffect(() => {
    const fetchTimeZone = async () => {
      if (clientData?.id) {
        setLoadingTimeZone(true);
        try {
          const timeZone = await getUserTimeZoneById(clientData.id);
          setUserTimeZone(ensureIANATimeZone(timeZone));
        } catch (error) {
          console.error('Error fetching time zone:', error);
          setUserTimeZone('America/New_York');
        } finally {
          setLoadingTimeZone(false);
        }
      }
    };

    fetchTimeZone();
  }, [clientData]);

  const refreshData = () => {
    if (clientData?.id) {
      setLoading(true);
      fetchClinicalDocuments(clientData.id)
        .then(documents => setClinicalDocuments(documents))
        .catch(error => {
          console.error('Error refreshing clinical documents:', error);
          toast({
            title: "Error",
            description: "Failed to refresh clinical documents.",
            variant: "destructive"
          });
        })
        .finally(() => setLoading(false));
    }
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const url = await getDocumentDownloadURL(filePath);
      if (url) {
        setSelectedDocumentUrl(url);
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to generate document URL.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (filePath: string) => {
    try {
      const url = await getDocumentDownloadURL(filePath);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filePath.substring(filePath.lastIndexOf('/') + 1));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate document URL for download.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document.",
        variant: "destructive"
      });
    }
  };

  const timeZoneDisplay = formatTimeZoneDisplay(userTimeZone);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Clinical Documents</h3>
        {loading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading documents...
          </div>
        ) : clinicalDocuments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Date <span className="text-xs text-gray-500">({timeZoneDisplay})</span></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicalDocuments.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>
                    {formatTimeInUserTimeZone(doc.document_date, userTimeZone, 'MMMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc.file_path)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.file_path)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-gray-500">No clinical documents found.</div>
        )}
      </div>

      {selectedAppointment && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">PHQ-9 Assessment</h3>
          <Button onClick={() => setShowPHQ9(true)}>
            Start PHQ-9 Assessment
          </Button>
        </div>
      )}

      {showPHQ9 && (
        <PHQ9Template
          onClose={() => setShowPHQ9(false)}
          clinicianName={clinicianName}
          clientData={clientData}
          appointmentId={selectedAppointment?.id || null}
          onComplete={() => {
            setShowPHQ9(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default DocumentationTab;
