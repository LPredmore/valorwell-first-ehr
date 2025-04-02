
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

interface DocumentInfo {
  clientId: string;
  documentType: string;
  documentDate: string | Date;
  documentTitle: string;
  createdBy?: string;
}

/**
 * Generates PDF from an HTML element and saves it to Supabase storage
 */
export const generateAndSavePDF = async (
  elementId: string,
  documentInfo: DocumentInfo
): Promise<string | null> => {
  try {
    // Format date for file naming
    const formattedDate = typeof documentInfo.documentDate === 'string' 
      ? documentInfo.documentDate 
      : documentInfo.documentDate.toISOString().split('T')[0];
    
    // Step 1: Generate PDF from HTML element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return null;
    }
    
    // Add a class to control styling for PDF generation
    element.classList.add('generating-pdf');
    
    // Generate PDF content
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Remove PDF generation class
    element.classList.remove('generating-pdf');
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Convert PDF to blob for upload
    const pdfBlob = pdf.output('blob');
    
    // Step 2: Upload PDF to Supabase storage
    const filePath = `${documentInfo.clientId}/${documentInfo.documentType}/${formattedDate}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('clinical_documents')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return null;
    }
    
    // Step 3: Get the URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('clinical_documents')
      .getPublicUrl(filePath);
    
    // Step 4: Save document metadata to clinical_documents table
    const { error: dbError } = await supabase
      .from('clinical_documents')
      .insert({
        client_id: documentInfo.clientId,
        document_type: documentInfo.documentType,
        document_date: formattedDate,
        document_title: documentInfo.documentTitle,
        file_path: filePath,
        created_by: documentInfo.createdBy
      });
    
    if (dbError) {
      console.error('Error saving document metadata:', dbError);
      return null;
    }
    
    return filePath;
  } catch (error) {
    console.error('Error generating or saving PDF:', error);
    return null;
  }
};
