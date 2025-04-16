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
    
    // REDUCED SCALE: Lower scale factor to reduce file size
    const scale = 1; // Reduced from 2 to 1 to decrease file size
    const pixelsPerMm = 3.78; // Approximate conversion factor
    
    console.log('Generating PDF with dimensions:', { 
      pdfWidth, pdfHeight, contentWidth, elementWidth: width 
    });
    
    // Generate PDF using improved page segmentation
    let verticalOffset = margin;
    let currentPage = 0;
    
    // Capture the whole content at once with optimized resolution
    const canvas = await html2canvas(preparedElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      // OPTIMIZATION: Reduce image quality to decrease file size
      imageTimeout: 0, // Disable timeout for large forms
      onclone: (clonedDoc) => {
        // Further optimize the cloned document for PDF generation
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Remove unnecessary elements that increase file size
          const images = clonedElement.querySelectorAll('img:not(.essential-image)');
          images.forEach(img => {
            img.remove();
          });
          
          // Simplify complex UI elements
          const complexElements = clonedElement.querySelectorAll('.complex-ui');
          complexElements.forEach(el => {
            el.classList.add('simplified-for-pdf');
          });
        }
      }
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
        // OPTIMIZATION: Use lower image quality for PDF
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.7); // Use JPEG with 70% quality instead of PNG
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
        
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      }
    }
    
    // Clean up the temporary element
    document.body.removeChild(preparedElement);
    
    // Get initial PDF data as array buffer
    let pdfData = pdf.output('arraybuffer');
    let currentBlob = new Blob([pdfData], { type: 'application/pdf' });
    
    // Check file size and compress if needed
    const fileSizeMB = currentBlob.size / (1024 * 1024);
    console.log(`Initial PDF file size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 5) {
      console.warn('PDF file size exceeds recommended limit, applying additional compression');
      
      // Create a new PDF with more aggressive compression
      const compressedPdf = new jsPDF('p', 'mm', 'a4');
      
      // Add content with more aggressive compression
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          compressedPdf.addPage();
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
          
          // Add this page segment to the PDF with more aggressive compression
          const imgData = pageCanvas.toDataURL('image/jpeg', 0.5); // Use JPEG with 50% quality
          const imgWidth = pdfWidth - (margin * 2);
          const imgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
          
          compressedPdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        }
      }
      
      // Get compressed PDF data
      const compressedData = compressedPdf.output('arraybuffer');
      const compressedBlob = new Blob([compressedData], { type: 'application/pdf' });
      const compressedSizeMB = compressedBlob.size / (1024 * 1024);
      console.log(`Compressed PDF file size: ${compressedSizeMB.toFixed(2)} MB`);
      
      if (compressedSizeMB < fileSizeMB) {
        console.log('Using more compressed PDF version for upload');
        currentBlob = compressedBlob;
      }
    }
    
    // Step 2: Upload PDF to Supabase storage
    const filePath = `${documentInfo.clientId}/${documentInfo.documentType}/${formattedDate}.pdf`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('clinical_documents')
        .upload(filePath, currentBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        
        // If upload fails, try text-only version
        if (uploadError.message?.includes('413') || uploadError.message?.includes('too large')) {
          console.log('Attempting fallback to text-only PDF');
          
          // Create text-only PDF
          const textPdf = new jsPDF('p', 'mm', 'a4');
          
          // Extract text content from the form
          const textContent = preparedElement.innerText || 'Form content unavailable';
          
          // Add text content to PDF
          const splitText = textPdf.splitTextToSize(textContent, pdfWidth - (margin * 2));
          textPdf.setFontSize(10);
          
          let yPosition = margin;
          const lineHeight = 5;
          
          // Add title
          textPdf.setFontSize(16);
          textPdf.text(documentInfo.documentTitle, pdfWidth / 2, yPosition, { align: 'center' });
          yPosition += lineHeight * 2;
          
          // Reset font size for content
          textPdf.setFontSize(10);
          
          // Add content page by page
          for (let i = 0; i < splitText.length; i++) {
            if (yPosition > pdfHeight - margin) {
              textPdf.addPage();
              yPosition = margin;
            }
            
            textPdf.text(splitText[i], margin, yPosition);
            yPosition += lineHeight;
          }
          
          // Get text PDF data
          const textPdfData = textPdf.output('arraybuffer');
          const textPdfBlob = new Blob([textPdfData], { type: 'application/pdf' });
          
          // Try uploading text-only version
          const { error: textUploadError } = await supabase.storage
            .from('clinical_documents')
            .upload(filePath, textPdfBlob, {
              contentType: 'application/pdf',
              upsert: true
            });
          
          if (textUploadError) {
            console.error('Error uploading text-only PDF:', textUploadError);
            return null;
          }
          console.log('Successfully uploaded text-only PDF as fallback');
        } else {
          return null;
        }
      }
    } catch (uploadError) {
      console.error('Exception during PDF upload:', uploadError);
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
    console.error('Error in generateAndSavePDF:', error);
    return null;
  }
};
