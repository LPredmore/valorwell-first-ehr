
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
    
    // Step 3: Update the document assignment if found
    if (exactAssignments && exactAssignments.length > 0) {
      const assignment = exactAssignments[0];
      console.log(`Found document assignment with ID: ${assignment.id}, name: ${assignment.document_name}, current status: ${assignment.status}`);
      
      // Use a transaction to ensure the update is committed
      // FIX: Remove completed_at and pdf_url fields that don't exist in the table
      const { error: updateError } = await supabase
        .from('document_assignments')
        .update({
          status: 'completed',
          // Store PDF path in the response_data JSON field instead
          response_data: { ...responseData, pdf_path: filePath }
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
      
      console.log(`Successfully updated document assignment status to 'completed'`);
      
      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('document_assignments')
        .select('status')
        .eq('id', assignment.id)
        .single();
        
      if (verifyError) {
        console.error('Error verifying document assignment update:', verifyError);
      } else {
        console.log(`Verified document status is now: ${verifyData.status}`);
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
          
        const { error: insertError } = await supabase
          .from('clinical_documents')
          .insert({
            client_id: documentInfo.clientId,
            document_type: documentInfo.documentType,
            document_date: formattedDate,
            document_title: documentInfo.documentTitle,
            file_path: filePath,
            created_by: documentInfo.createdBy
          });
          
        if (insertError) {
          console.error('Error saving document metadata:', insertError);
        } else {
          console.log('Successfully saved document metadata');
        }
      }
    } catch (error) {
      console.error('Error in clinical_documents handling:', error);
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
