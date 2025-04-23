
/**
 * Document Generators
 * 
 * This module contains functions for generating various documents.
 */

import { generateAndSavePDF } from '@/utils/reactPdfUtils';
import { DocumentInfo } from '../types';

/**
 * Generate a PDF document
 * @param contentElementId The ID of the element to render to PDF
 * @param documentInfo Information about the document
 * @returns The path to the saved PDF or null if generation failed
 */
export const generateDocument = async (
  contentElementId: string,
  documentInfo: DocumentInfo
): Promise<string | null> => {
  try {
    return await generateAndSavePDF(contentElementId, documentInfo);
  } catch (error) {
    console.error('Error generating PDF document:', error);
    return null;
  }
};

// Re-export the utility functions
export { generateAndSavePDF } from '@/utils/reactPdfUtils';
