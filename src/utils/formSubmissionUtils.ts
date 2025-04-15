/**
 * Shared utility functions for form submission and document handling
 */

import { supabase } from '@/integrations/supabase/client';
import { generateAndSavePDF } from './pdfUtils';

interface DocumentInfo {
  clientId: string;
  documentType: string;
  documentDate: string | Date;
  documentTitle: string;
  createdBy?: string;
}

interface FormSubmissionResult {
  success: boolean;
  filePath?: string;
  error?: any;
  message?: string;
}

/**
 * Handles form submission, PDF generation, and document assignment updates
 * @param elementId - ID of the HTML element to generate PDF from
 * @param documentInfo - Information about the document
 * @param documentName - Name of the document (used to find the correct assignment)
 * @param responseData - Form response data to save
 * @returns Promise with submission result
 */
export const handleFormSubmission = async (
  elementId: string,
  documentInfo: DocumentInfo,
  documentName: string,
  responseData: any
): Promise<FormSubmissionResult> => {
  try {
    // Step 1: Generate and save PDF
    const filePath = await generateAndSavePDF(elementId, documentInfo);
    
    if (!filePath) {
      return {
        success: false,
        error: new Error('Failed to generate PDF'),
        message: 'There was a problem generating the document. Please try again.'
      };
    }
    
    // Step 2: Find the document assignment by name
    const { data: assignments, error: assignmentError } = await supabase
      .from('document_assignments')
      .select('*')
      .eq('client_id', documentInfo.clientId)
      .ilike('document_name', `%${documentName}%`);
      
    if (assignmentError) {
      console.error('Error finding document assignment:', assignmentError);
      return {
        success: false,
        filePath,
        error: assignmentError,
        message: 'Document was generated but there was an issue updating its status.'
      };
    }
    
    // Step 3: Update the document assignment if found
    if (assignments && assignments.length > 0) {
      const assignment = assignments[0];
      
      const { error: updateError } = await supabase
        .from('document_assignments')
        .update({
          status: 'completed',
          pdf_url: filePath,
          completed_at: new Date().toISOString(),
          response_data: responseData
        })
        .eq('id', assignment.id);
        
      if (updateError) {
        console.error('Error updating document assignment:', updateError);
        return {
          success: false,
          filePath,
          error: updateError,
          message: 'Document was generated but there was an issue updating its status.'
        };
      }
    } else {
      console.warn(`No document assignment found for ${documentName}`);
    }
    
    return {
      success: true,
      filePath,
      message: 'Your form has been submitted successfully.'
    };
  } catch (error) {
    console.error('Error in form submission:', error);
    return {
      success: false,
      error,
      message: 'There was a problem submitting your form. Please try again.'
    };
  }
};
