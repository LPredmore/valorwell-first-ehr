
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getDocumentList, 
  getDocumentById, 
  getDocumentAssignments, 
  updateDocumentAssignmentStatus,
  saveDocumentRecord,
  getDocumentTemplates,
  getDocumentTemplateById
} from '../services/documents';
import { getQueryOptions } from '../utils/cache';

// Hook for fetching document list
export const useDocumentList = (clientId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['documents', clientId]),
    queryFn: async () => {
      if (!clientId) return [];
      return getDocumentList(clientId);
    },
    enabled: !!clientId
  });
};

// Hook for fetching a single document
export const useDocumentDetails = (documentId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['document', documentId]),
    queryFn: async () => {
      if (!documentId) return null;
      return getDocumentById(documentId);
    },
    enabled: !!documentId
  });
};

// Hook for document assignments
export const useDocumentAssignments = (clientId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['document-assignments', clientId]),
    queryFn: async () => {
      if (!clientId) return [];
      return getDocumentAssignments(clientId);
    },
    enabled: !!clientId
  });
};

// Hook for updating document assignment status
export const useUpdateDocumentAssignment = () => {
  return useMutation({
    mutationFn: ({ 
      assignmentId, 
      status, 
      pdfUrl 
    }: { 
      assignmentId: string; 
      status: string; 
      pdfUrl?: string;
    }) => {
      return updateDocumentAssignmentStatus(assignmentId, status, pdfUrl);
    }
  });
};

// Hook for saving document records
export const useSaveDocument = () => {
  return useMutation({
    mutationFn: ({ 
      documentInfo, 
      pdfPath 
    }: { 
      documentInfo: any; 
      pdfPath: string | null;
    }) => {
      return saveDocumentRecord(documentInfo, pdfPath);
    }
  });
};

// Hook for document templates
export const useDocumentTemplates = (category?: string) => {
  return useQuery({
    ...getQueryOptions(['document-templates', category], 'persistent'), // Templates change infrequently
    queryFn: () => getDocumentTemplates(category)
  });
};

// Hook for single document template
export const useDocumentTemplate = (templateId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['document-template', templateId], 'persistent'),
    queryFn: async () => {
      if (!templateId) return null;
      return getDocumentTemplateById(templateId);
    },
    enabled: !!templateId
  });
};
