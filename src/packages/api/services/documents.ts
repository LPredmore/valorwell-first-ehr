
import { supabase } from '../client';
import { handleApiError } from '../utils/error';
import { DocumentInfo } from '@/packages/documents/types';

// Document retrieval functions
export const getDocumentList = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getDocumentById = async (documentId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Document assignments
export const getDocumentAssignments = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('document_assignments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateDocumentAssignmentStatus = async (
  assignmentId: string, 
  status: string, 
  pdfUrl?: string
) => {
  try {
    const updates: any = { status };
    if (pdfUrl) updates.pdf_url = pdfUrl;

    const { data, error } = await supabase
      .from('document_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Document creation and storage
export const saveDocumentRecord = async (documentInfo: DocumentInfo, pdfPath: string | null) => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .insert({
        client_id: documentInfo.clientId,
        document_type: documentInfo.documentType,
        document_title: documentInfo.documentTitle,
        document_date: documentInfo.documentDate,
        created_by: documentInfo.createdBy,
        file_path: pdfPath
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Document templates
export const getDocumentTemplates = async (category?: string) => {
  try {
    let query = supabase
      .from('documents')
      .select('*');
      
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('title');
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getDocumentTemplateById = async (templateId: string) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', templateId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};
