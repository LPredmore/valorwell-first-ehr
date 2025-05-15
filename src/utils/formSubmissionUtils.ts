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
    console.log(`Starting form submission for document: ${documentName}`);
    
    // Step 1: Generate and save PDF
    const filePath = await generateAndSavePDF(elementId, documentInfo);
    
    if (!filePath) {
      console.error('PDF generation failed');
      return {
        success: false,
        error: new Error('Failed to generate PDF'),
        message: 'There was a problem generating the document. Please try again.'
      };
    }
    
    console.log(`PDF generated successfully at: ${filePath}`);
    
    // Step 2: Find the document assignment by exact name first, then try partial match
    console.log(`Searching for document assignment with name: ${documentName}`);
    
    // First try exact match
    let { data: exactAssignments, error: exactError } = await supabase
      .from('document_assignments')
      .select('*')
      .eq('client_id', documentInfo.clientId)
      .eq('document_name', documentName);
      
    if (exactError) {
      console.error('Error finding document assignment with exact match:', exactError);
    }
    
    // If exact match fails, try partial match
    if (!exactAssignments || exactAssignments.length === 0) {
      console.log(`No exact match found, trying partial match for: ${documentName}`);
      
      const { data: partialAssignments, error: partialError } = await supabase
        .from('document_assignments')
        .select('*')
        .eq('client_id', documentInfo.clientId)
        .ilike('document_name', `%${documentName}%`);
        
      if (partialError) {
        console.error('Error finding document assignment with partial match:', partialError);
        return {
          success: false,
          filePath,
          error: partialError,
          message: 'Document was generated but there was an issue updating its status.'
        };
      }
      
      exactAssignments = partialAssignments;
    }
    
    // Special case for Informed Consent
    if ((!exactAssignments || exactAssignments.length === 0) && documentName.includes('Informed Consent')) {
      console.log('Trying special case search for Informed Consent');
      
      const { data: informedConsentAssignments, error: consentError } = await supabase
        .from('document_assignments')
        .select('*')
        .eq('client_id', documentInfo.clientId)
        .eq('document_name', 'Informed Consent');
        
      if (consentError) {
        console.error('Error finding Informed Consent assignment:', consentError);
      } else if (informedConsentAssignments && informedConsentAssignments.length > 0) {
        console.log('Found Informed Consent assignment with exact name match');
        exactAssignments = informedConsentAssignments;
      }
    }
    
    // Step 3: Delete the document assignment if found (instead of updating status)
    if (exactAssignments && exactAssignments.length > 0) {
      const assignment = exactAssignments[0];
      console.log(`Found document assignment with ID: ${assignment.id}, name: ${assignment.document_name}, current status: ${assignment.status}`);
      
      // DELETE the document assignment instead of updating it
      const { error: deleteError } = await supabase
        .from('document_assignments')
        .delete()
        .eq('id', assignment.id);
        
      if (deleteError) {
        console.error('Error deleting document assignment:', deleteError);
        return {
          success: false,
          filePath,
          error: deleteError,
          message: 'Document was generated but there was an issue removing it from your assignments.'
        };
      }
      
      console.log(`Successfully deleted document assignment with ID: ${assignment.id}`);
      
      // Verify the deletion was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('document_assignments')
        .select('id')
        .eq('id', assignment.id);
        
      if (verifyError) {
        console.error('Error verifying document assignment deletion:', verifyError);
      } else if (!verifyData || verifyData.length === 0) {
        console.log('Verified document assignment was successfully deleted');
      } else {
        console.warn('Document assignment still exists after deletion attempt');
      }
    } else {
      console.warn(`No document assignment found for ${documentName}`);
    }
    
    // Step 4: Save to clinical_documents table if not already done by PDF generation
    try {
      const { data: existingDoc, error: checkError } = await supabase
        .from('clinical_documents')
        .select('id')
        .eq('file_path', filePath)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking for existing clinical document:', checkError);
      }
      
      if (!existingDoc) {
        console.log('Saving document metadata to clinical_documents table');
        
        const formattedDate = typeof documentInfo.documentDate === 'string' 
          ? documentInfo.documentDate 
          : documentInfo.documentDate.toISOString().split('T')[0];
          
        // Store the PDF path and response data in the clinical_documents table
        const { error: insertError } = await supabase
          .from('clinical_documents')
          .insert({
            client_id: documentInfo.clientId,
            document_type: documentInfo.documentType,
            document_date: formattedDate,
            document_title: documentInfo.documentTitle,
            file_path: filePath,
            created_by: documentInfo.createdBy,
            response_data: responseData // Store response data here instead of document_assignments
          });
          
        if (insertError) {
          console.error('Error saving document metadata:', insertError);
        } else {
          console.log('Successfully saved document metadata with response data');
        }
      }
    } catch (error) {
      console.error('Error in clinical_documents handling:', error);
    }
    
    return {
      success: true,
      filePath,
      message: 'Your form has been submitted successfully and removed from your assignments.'
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
