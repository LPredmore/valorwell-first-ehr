
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
    
    // Create a deep clone for PDF generation to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);
    
    // Process all form elements in the clone to ensure their values are properly rendered
    processFormElementsForPDF(clone);
    
    // Position the clone off-screen
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.width = element.offsetWidth + 'px';
    clone.style.backgroundColor = 'white';
    clone.style.padding = '20px';
    
    // Wait a moment for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get dimensions for PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // margin in mm
    const contentWidth = pdfWidth - (margin * 2);
    
    // Create canvas from the prepared clone
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: clone.offsetWidth,
      onclone: clonedDoc => {
        // Process all form elements in the cloned document
        const clonedElement = clonedDoc.body.lastChild as HTMLElement;
        clonedElement.style.width = clone.offsetWidth + 'px';
        
        // Ensure all form values are properly rendered
        const textareas = clonedElement.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          const value = textarea.value;
          const div = document.createElement('div');
          div.className = 'pdf-value-display';
          div.textContent = value;
          div.style.whiteSpace = 'pre-wrap';
          if (textarea.parentNode) {
            textarea.parentNode.replaceChild(div, textarea);
          }
        });
      }
    });
    
    // Calculate scaling for the PDF
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Handle multi-page PDFs if the content is too long
    let position = margin;
    const pageHeight = pdfHeight - margin * 2;
    
    // Add the first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
    
    // Add additional pages if needed
    let heightLeft = imgHeight - pageHeight;
    
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Clean up the clone
    document.body.removeChild(clone);
    
    // Remove PDF generation class from original element
    element.classList.remove('generating-pdf');
    
    // Convert PDF to blob
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

/**
 * Process form elements to ensure their values are properly displayed in the PDF
 */
const processFormElementsForPDF = (element: HTMLElement) => {
  // Process all inputs
  const inputs = element.querySelectorAll('input');
  inputs.forEach(input => {
    if (input.type === 'text' || input.type === 'date') {
      // Create a visible text representation of the input value
      const valueSpan = document.createElement('div');
      valueSpan.className = 'pdf-value-display';
      valueSpan.textContent = input.value || '';
      
      // Replace the input with the span
      if (input.parentNode) {
        input.parentNode.replaceChild(valueSpan, input);
      }
    }
  });
  
  // Process textareas - replace with div to maintain line breaks and content size
  const textareas = element.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    // Create a div to represent the textarea content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'pdf-value-display';
    
    // Preserve content and line breaks
    contentDiv.textContent = textarea.value || '';
    contentDiv.style.whiteSpace = 'pre-wrap';
    
    // Add more height for textareas with substantial content
    const lineCount = (textarea.value.match(/\n/g) || []).length + 1;
    if (lineCount > 2 || textarea.value.length > 100) {
      contentDiv.style.minHeight = Math.min(Math.max(lineCount * 20, 60), 300) + 'px';
    }
    
    // Replace the textarea with the content div
    if (textarea.parentNode) {
      textarea.parentNode.replaceChild(contentDiv, textarea);
    }
  });
  
  // Process select elements and custom select components
  processSelectElements(element);
  
  // Process elements with data-pdf-value attributes
  const elementsWithDataAttributes = element.querySelectorAll('[data-pdf-value]');
  elementsWithDataAttributes.forEach(el => {
    const pdfValue = el.getAttribute('data-pdf-value');
    if (pdfValue) {
      const valueDiv = document.createElement('div');
      valueDiv.className = 'pdf-value-display';
      valueDiv.textContent = pdfValue;
      valueDiv.style.whiteSpace = 'pre-wrap';
      
      if (el.parentNode) {
        el.parentNode.replaceChild(valueDiv, el as Node);
      }
    }
  });
  
  // Hide any remaining form controls that might interfere with PDF rendering
  const formControls = element.querySelectorAll('button:not(.pdf-visible)');
  formControls.forEach(control => {
    (control as HTMLElement).style.display = 'none';
  });
  
  // Hide private notes
  const privateNotes = element.querySelectorAll('.private-note-container');
  privateNotes.forEach(note => {
    (note as HTMLElement).style.display = 'none';
  });
  
  return element;
};

/**
 * Process select elements and radix select components
 */
const processSelectElements = (element: HTMLElement) => {
  // Process native select elements
  const selects = element.querySelectorAll('select');
  selects.forEach(select => {
    const selectedOption = select.options[select.selectedIndex];
    const valueSpan = document.createElement('div');
    valueSpan.className = 'pdf-value-display';
    valueSpan.textContent = selectedOption ? selectedOption.text : '';
    
    // Replace the select with the span
    if (select.parentNode) {
      select.parentNode.replaceChild(valueSpan, select);
    }
  });
  
  // Process Radix UI Select components
  const radixSelects = element.querySelectorAll('[data-radix-select-trigger]');
  radixSelects.forEach(selectTrigger => {
    const selectValue = selectTrigger.querySelector('[data-radix-select-value]');
    const valueDiv = document.createElement('div');
    valueDiv.className = 'pdf-value-display';
    
    // Extract the displayed value from the select component
    const valueText = selectValue ? selectValue.textContent : '';
    valueDiv.textContent = valueText || '';
    
    // Try to find a hidden span for PDF that might contain the value
    const hiddenSpan = (selectTrigger.parentNode as HTMLElement)?.querySelector('.pdf-only');
    if (hiddenSpan && hiddenSpan.textContent) {
      valueDiv.textContent = hiddenSpan.textContent;
    }
    
    // Replace the select trigger with the value div
    if (selectTrigger.parentNode) {
      selectTrigger.parentNode.replaceChild(valueDiv, selectTrigger as Node);
    }
  });
  
  // Look for any hidden fields with select values
  const hiddenFields = element.querySelectorAll('.hidden.pdf-only');
  hiddenFields.forEach(field => {
    if (field.textContent && field.textContent.trim() !== '') {
      const valueDiv = document.createElement('div');
      valueDiv.className = 'pdf-value-display';
      valueDiv.textContent = field.textContent;
      
      // Make the hidden field visible by replacing it
      if (field.parentNode) {
        field.parentNode.replaceChild(valueDiv, field as Node);
      }
    }
  });
};
