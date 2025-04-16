
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { StorageError } from '@supabase/storage-js';

interface DocumentInfo {
  clientId: string;
  documentType: string;
  documentDate: string | Date;
  documentTitle: string;
  createdBy?: string;
}

export const generateAndSavePDF = async (
  elementId: string,
  documentInfo: DocumentInfo
): Promise<string | null> => {
  try {
    const formattedDate = typeof documentInfo.documentDate === 'string' 
      ? documentInfo.documentDate 
      : documentInfo.documentDate.toISOString().split('T')[0];
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return null;
    }
    
    // Create an optimized clone for PDF generation
    const preparedElement = element.cloneNode(true) as HTMLElement;
    document.body.appendChild(preparedElement);
    preparedElement.style.position = 'absolute';
    preparedElement.style.left = '-9999px';
    
    // Define PDF dimensions (A4)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    
    const canvas = await html2canvas(preparedElement, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Calculate content height
    const contentHeightMm = canvas.height / (3.78); // Approximate conversion to mm
    const contentHeightPerPage = pdfHeight - (margin * 2);
    const totalPages = Math.ceil(contentHeightMm / contentHeightPerPage);
    
    // Add content page by page
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      
      const sourceY = page * contentHeightPerPage * 3.78;
      const sourceHeight = Math.min(
        contentHeightPerPage * 3.78,
        canvas.height - sourceY
      );
      
      if (sourceHeight <= 0) continue;
      
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const ctx = pageCanvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(
          canvas, 
          0, sourceY, canvas.width, sourceHeight,
          0, 0, pageCanvas.width, pageCanvas.height
        );
        
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.7);
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
        
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      }
    }
    
    // Clean up
    document.body.removeChild(preparedElement);
    
    // Get PDF as array buffer
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    
    // Upload to Supabase storage
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
    
    return filePath;
  } catch (error) {
    console.error('Error generating or saving PDF:', error);
    return null;
  }
};
