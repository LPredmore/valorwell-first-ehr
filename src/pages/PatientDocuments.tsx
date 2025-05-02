
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FileIcon, DownloadIcon, PlusIcon } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Document {
  id: string;
  document_title: string;
  document_type: string;
  document_date: string;
  file_path: string;
}

const documentTypes = [
  'Medical Records',
  'Insurance Information',
  'Consent Forms',
  'Assessment Results',
  'Treatment Plans',
  'Progress Notes',
  'Discharge Summary',
  'Other'
];

const PatientDocuments = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: '',
    date: new Date().toISOString().slice(0, 10),
    file: null as File | null
  });

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  const fetchDocuments = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinical_documents')
        .select('*')
        .eq('client_id', patientId)
        .order('document_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Could not load patient documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string, title: string) => {
    try {
      // Get document URL
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.setAttribute('download', title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Document download started'
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Could not download document',
        variant: 'destructive'
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument({
        ...newDocument,
        file: e.target.files[0]
      });
    }
  };

  const handleUploadSubmit = async () => {
    if (!newDocument.file || !newDocument.title || !newDocument.type || !patientId) {
      toast({
        title: 'Error',
        description: 'Please fill out all fields and select a file',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadingFile(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('User not authenticated');
      
      // Upload file to storage
      const filePath = `${patientId}/${Date.now()}-${newDocument.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, newDocument.file);
      
      if (uploadError) throw uploadError;
      
      // Add record to database
      const { error: dbError } = await supabase
        .from('clinical_documents')
        .insert({
          client_id: patientId,
          document_title: newDocument.title,
          document_type: newDocument.type,
          document_date: newDocument.date,
          file_path: filePath,
          created_by: userData.user.id
        });
      
      if (dbError) throw dbError;
      
      // Reset form and close dialog
      setNewDocument({
        title: '',
        type: '',
        date: new Date().toISOString().slice(0, 10),
        file: null
      });
      setIsUploadDialogOpen(false);
      
      // Refresh documents list
      fetchDocuments();
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Could not upload document',
        variant: 'destructive'
      });
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Patient Documents</h1>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton height="100px" />
            <LoadingSkeleton height="100px" />
            <LoadingSkeleton height="100px" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">Upload a document to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{doc.document_title}</h3>
                      <p className="text-sm text-gray-500">{doc.document_type}</p>
                      <p className="text-sm text-gray-400">{formatDate(doc.document_date)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc.file_path, doc.document_title)}
                    >
                      <DownloadIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="Enter document title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select
                  value={newDocument.type}
                  onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Document Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDocument.date}
                  onChange={(e) => setNewDocument({ ...newDocument, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={uploadingFile}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadSubmit}
                  disabled={uploadingFile || !newDocument.file}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default PatientDocuments;
