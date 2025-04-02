
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
    
    // Get the computed style to determine the appropriate scaling
    const computedStyle = window.getComputedStyle(element);
    const width = parseFloat(computedStyle.width);
    
    // Define PDF dimensions and scaling
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // margin in mm
    const contentWidth = pdfWidth - (margin * 2);
    
    // Calculate the total height and determine how many pages we need
    const contentHeightEstimate = element.scrollHeight;
    const scale = contentWidth / width;
    const totalHeightMM = (contentHeightEstimate * scale * 0.264583); // Convert pixels to mm
    const totalPages = Math.ceil(totalHeightMM / (pdfHeight - (margin * 2)));
    
    // Create a clone of the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);
    clone.style.width = width + 'px';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    
    // Hide elements with the 'private-note-container' class for PDF generation
    const privateNotes = clone.querySelectorAll('.private-note-container');
    privateNotes.forEach(note => {
      (note as HTMLElement).style.display = 'none';
    });
    
    // Generate PDF with multiple pages if needed
    let currentPage = 0;
    let pdfBlob;
    
    if (totalPages <= 1) {
      // For single page documents, use the standard approach
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdfBlob = pdf.output('blob');
    } else {
      // For multi-page documents, slice the content into pages
      const heightPerPage = Math.floor(contentHeightEstimate / totalPages);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Set the window height to capture just this page's content
        clone.style.height = heightPerPage + 'px';
        clone.style.overflow = 'hidden';
        clone.scrollTop = page * heightPerPage;
        
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: heightPerPage
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      }
      
      pdfBlob = pdf.output('blob');
    }
    
    // Clean up the clone
    document.body.removeChild(clone);
    
    // Remove PDF generation class from original element
    element.classList.remove('generating-pdf');
    
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
