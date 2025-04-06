
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
 * Pre-processes the DOM element for PDF generation by optimizing text and layout
 */
const prepareElementForPDF = (element: HTMLElement): HTMLElement => {
  // Create a deep clone to avoid modifying the original DOM
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Add PDF generation class to control styling
  clone.classList.add('generating-pdf');
  
  // Process all textareas to ensure proper text rendering
  const textareas = clone.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    // Create a div with the same content to better handle text overflow
    const div = document.createElement('div');
    div.innerHTML = textarea.value || '';
    div.className = textarea.className;
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    textarea.parentNode?.replaceChild(div, textarea);
  });
  
  // Process inputs to properly show their values
  const inputs = clone.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
  inputs.forEach(input => {
    const inputElement = input as HTMLInputElement;
    inputElement.setAttribute('value', inputElement.value);
  });
  
  // Hide any elements marked as private
  const privateElements = clone.querySelectorAll('.private-note-container');
  privateElements.forEach(el => {
    el.setAttribute('style', 'display: none !important');
  });
  
  // Add explicit page break indicators for large sections
  const sections = clone.querySelectorAll('section, .section');
  sections.forEach((section, index) => {
    if (index > 0) {
      // Don't add page break to first section
      section.classList.add('pdf-section');
    }
  });
  
  return clone;
};

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
    
    // Step 1: Get and prepare the HTML element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return null;
    }
    
    // Create an optimized clone for PDF generation to avoid modifying the visible DOM
    const preparedElement = prepareElementForPDF(element);
    
    // Temporarily add to document for rendering
    document.body.appendChild(preparedElement);
    
    // Position off-screen
    preparedElement.style.position = 'absolute';
    preparedElement.style.left = '-9999px';
    preparedElement.style.top = '-9999px';
    
    // Get computed style to determine dimensions
    const computedStyle = window.getComputedStyle(preparedElement);
    const width = parseFloat(computedStyle.width);
    
    // Define PDF dimensions (A4)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // margin in mm
    const contentWidth = pdfWidth - (margin * 2);
    
    // Improved scaling calculation
    const scale = 2; // Higher scale for better quality
    const pixelsPerMm = 3.78; // Approximate conversion factor
    
    console.log('Generating PDF with dimensions:', { 
      pdfWidth, pdfHeight, contentWidth, elementWidth: width 
    });
    
    // Generate PDF using improved page segmentation
    let verticalOffset = margin;
    let currentPage = 0;
    
    // Capture the whole content at once with high resolution
    const canvas = await html2canvas(preparedElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
    });
    
    // Calculate how many pages we need based on content height
    const contentHeightMm = canvas.height / (scale * pixelsPerMm);
    const contentHeightPerPage = pdfHeight - (margin * 2);
    const totalPages = Math.ceil(contentHeightMm / contentHeightPerPage);
    
    console.log('PDF content analysis:', { 
      contentHeightMm, contentHeightPerPage, totalPages, canvasHeight: canvas.height 
    });
    
    // Add content to PDF, page by page
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      
      // Calculate which portion of the canvas to use for this page
      const sourceY = page * contentHeightPerPage * scale * pixelsPerMm;
      const sourceHeight = Math.min(
        contentHeightPerPage * scale * pixelsPerMm,
        canvas.height - sourceY
      );
      
      // Only proceed if we have content for this page
      if (sourceHeight <= 0) continue;
      
      // Create a temporary canvas for this page segment
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const ctx = pageCanvas.getContext('2d');
      
      if (ctx) {
        // Draw the appropriate portion of the main canvas
        ctx.drawImage(
          canvas, 
          0, sourceY, canvas.width, sourceHeight,
          0, 0, pageCanvas.width, pageCanvas.height
        );
        
        // Add this page segment to the PDF
        const imgData = pageCanvas.toDataURL('image/png');
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      }
    }
    
    // Clean up the temporary element
    document.body.removeChild(preparedElement);
    
    // Get the PDF as a blob
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
