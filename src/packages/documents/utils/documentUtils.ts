
import { supabase } from '@/integrations/supabase/client';
import { DocumentInfo, DocumentStatus } from '../types';
import { generateDocument } from '../generators';

/**
 * Create a new document record in the database
 * @param documentInfo Information about the document
 * @param pdfPath Path to the PDF file in storage
 * @returns The ID of the created document record
 */
export const createDocumentRecord = async (
  documentInfo: DocumentInfo,
  pdfPath: string | null
): Promise<string | null> => {
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
    console.error('Error creating document record:', error);
    return null;
  }
};

/**
 * Update document assignment status
 * @param assignmentId ID of the document assignment
 * @param status New status of the assignment
 * @param pdfUrl Path to the PDF file
 * @returns Success boolean
 */
export const updateDocumentAssignmentStatus = async (
  assignmentId: string,
  status: string,
  pdfUrl?: string
): Promise<boolean> => {
  try {
    const updates: any = { status };
    if (pdfUrl) updates.pdf_url = pdfUrl;

    const { error } = await supabase
      .from('document_assignments')
      .update(updates)
      .eq('id', assignmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating document assignment status:', error);
    return false;
  }
};

/**
 * Process document submission and generate PDF
 * @param elementId Element ID to render to PDF
 * @param documentInfo Document information
 * @param documentTitle Title for the document
 * @param formData Form data for the document
 * @param assignmentId Optional assignment ID to update
 * @returns Result object with success status and message
 */
export const handleDocumentSubmission = async (
  elementId: string,
  documentInfo: DocumentInfo,
  documentTitle: string,
  formData: any,
  assignmentId?: string
): Promise<{ success: boolean; message?: string; documentId?: string }> => {
  try {
    // Generate PDF from form
    const pdfPath = await generateDocument(elementId, documentInfo);
    
    if (!pdfPath) {
      return {
        success: false,
        message: "Could not generate PDF document"
      };
    }

    // Create document record
    const documentId = await createDocumentRecord(documentInfo, pdfPath);
    
    if (!documentId) {
      return {
        success: false,
        message: "Could not save document record"
      };
    }

    // If this is for an assignment, update its status
    if (assignmentId) {
      const updated = await updateDocumentAssignmentStatus(assignmentId, 'completed', pdfPath);
      
      if (!updated) {
        console.warn('Could not update document assignment status');
      }
    }

    return {
      success: true,
      documentId,
      message: `${documentTitle} has been successfully created and saved.`
    };
  } catch (error) {
    console.error('Error processing document submission:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
};
