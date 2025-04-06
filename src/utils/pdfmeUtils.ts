
import { generate } from '@pdfme/generator';
import { Template, Font } from '@pdfme/common';
import { supabase } from '@/integrations/supabase/client';

/**
 * Standard fonts available in PDFme
 */
const fonts: Record<string, Font> = {
  Roboto: {
    data: fetch('https://pdf-templates.s3.amazonaws.com/Roboto-Regular.ttf').then(res => 
      res.arrayBuffer()
    ),
    fallback: true,
  },
};

interface PDFDocumentInfo {
  clientId: string;
  documentType: string;
  documentDate: string | Date;
  documentTitle: string;
  createdBy?: string;
}

/**
 * Generates a PDF using PDFme with the given template and form data
 * @param template The PDFme template object defining the document structure
 * @param inputs Data to populate the template with
 * @param documentInfo Metadata about the document for storage
 * @returns Path to the saved PDF file or null if operation failed
 */
export const generateAndSavePDFFromTemplate = async (
  template: Template,
  inputs: Record<string, any>[],
  documentInfo: PDFDocumentInfo
): Promise<string | null> => {
  try {
    // Format date for file naming
    const formattedDate = typeof documentInfo.documentDate === 'string' 
      ? documentInfo.documentDate 
      : documentInfo.documentDate.toISOString().split('T')[0];
    
    // Generate the PDF using PDFme
    const pdf = await generate({
      template,
      inputs,
      options: { font: fonts },
    });
    
    // Convert to Blob for storage
    const pdfBlob = new Blob([pdf], { type: 'application/pdf' });
    
    // Upload PDF to Supabase storage
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
    
    // Get the URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('clinical_documents')
      .getPublicUrl(filePath);
    
    // Save document metadata to clinical_documents table
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
 * Loads a template from Supabase storage
 * @param templateKey Identifier key for the template
 * @returns The template object or null if not found
 */
export const loadTemplate = async (templateKey: string): Promise<Template | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('pdf_templates')
      .download(`${templateKey}.json`);
    
    if (error) {
      console.error('Error loading template:', error);
      return null;
    }
    
    const templateText = await data.text();
    return JSON.parse(templateText) as Template;
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
  }
};

// Sample template for session notes - this would ideally be stored in Supabase and loaded dynamically
export const sessionNoteTemplate: Template = {
  basePdf: '',  // Base64 encoded PDF or URL to a blank PDF template
  schemas: [
    {
      clientName: { type: 'text', position: { x: 60, y: 50, width: 200, height: 15 } },
      clientDOB: { type: 'text', position: { x: 320, y: 50, width: 100, height: 15 } },
      sessionDate: { type: 'text', position: { x: 480, y: 50, width: 100, height: 15 } },
      clinicianName: { type: 'text', position: { x: 60, y: 70, width: 200, height: 15 } },
      sessionType: { type: 'text', position: { x: 320, y: 70, width: 150, height: 15 } },
      
      // Mental Status Section
      mentalStatusTitle: { type: 'text', position: { x: 60, y: 100, width: 150, height: 15 } },
      appearance: { type: 'text', position: { x: 60, y: 120, width: 150, height: 15 } },
      attitude: { type: 'text', position: { x: 220, y: 120, width: 150, height: 15 } },
      mood: { type: 'text', position: { x: 380, y: 120, width: 150, height: 15 } },
      affect: { type: 'text', position: { x: 60, y: 140, width: 150, height: 15 } },
      thoughtProcess: { type: 'text', position: { x: 220, y: 140, width: 150, height: 15 } },
      suicidalIdeation: { type: 'text', position: { x: 380, y: 140, width: 150, height: 15 } },
      
      // Treatment Objectives
      treatmentTitle: { type: 'text', position: { x: 60, y: 170, width: 200, height: 15 } },
      primaryObjective: { type: 'text', position: { x: 60, y: 190, width: 470, height: 30 } },
      intervention1: { type: 'text', position: { x: 60, y: 225, width: 230, height: 15 } },
      intervention2: { type: 'text', position: { x: 300, y: 225, width: 230, height: 15 } },
      
      secondaryObjective: { type: 'text', position: { x: 60, y: 245, width: 470, height: 30 } },
      intervention3: { type: 'text', position: { x: 60, y: 280, width: 230, height: 15 } },
      intervention4: { type: 'text', position: { x: 300, y: 280, width: 230, height: 15 } },
      
      // Assessment
      assessmentTitle: { type: 'text', position: { x: 60, y: 310, width: 200, height: 15 } },
      functioning: { type: 'text', position: { x: 60, y: 330, width: 150, height: 15 } },
      prognosis: { type: 'text', position: { x: 220, y: 330, width: 150, height: 15 } },
      progress: { type: 'text', position: { x: 380, y: 330, width: 150, height: 15 } },
      
      // Session Narrative
      narrativeTitle: { type: 'text', position: { x: 60, y: 360, width: 200, height: 15 } },
      sessionNarrative: { type: 'text', position: { x: 60, y: 380, width: 470, height: 100 } },
      
      // Signature
      signatureLabel: { type: 'text', position: { x: 60, y: 500, width: 100, height: 15 } },
      signature: { type: 'text', position: { x: 160, y: 500, width: 200, height: 15 } },
      dateLabel: { type: 'text', position: { x: 370, y: 500, width: 30, height: 15 } },
      date: { type: 'text', position: { x: 410, y: 500, width: 120, height: 15 } },
    }
  ]
};

// This function maps from your existing data format to the PDFme template format
export const mapSessionNoteToTemplateData = (formState: any): Record<string, any>[] => {
  return [{
    clientName: formState.patientName || '',
    clientDOB: formState.patientDOB || '',
    sessionDate: formState.sessionDate || new Date().toLocaleDateString(),
    clinicianName: formState.clinicianName || '',
    sessionType: formState.sessionType || '',
    
    mentalStatusTitle: 'Mental Status Examination',
    appearance: `Appearance: ${formState.appearance || ''}`,
    attitude: `Attitude: ${formState.attitude || ''}`,
    mood: `Mood: ${formState.mood || ''}`,
    affect: `Affect: ${formState.affect || ''}`,
    thoughtProcess: `Thought Process: ${formState.thoughtProcess || ''}`,
    suicidalIdeation: `Suicidal Ideation: ${formState.suicidalIdeation || ''}`,
    
    treatmentTitle: 'Treatment Objectives & Interventions',
    primaryObjective: formState.primaryObjective || '',
    intervention1: `1. ${formState.intervention1 || ''}`,
    intervention2: `2. ${formState.intervention2 || ''}`,
    
    secondaryObjective: formState.secondaryObjective || '',
    intervention3: `3. ${formState.intervention3 || ''}`,
    intervention4: `4. ${formState.intervention4 || ''}`,
    
    assessmentTitle: 'Assessment',
    functioning: `Functioning: ${formState.functioning || ''}`,
    prognosis: `Prognosis: ${formState.prognosis || ''}`,
    progress: `Progress: ${formState.progress || ''}`,
    
    narrativeTitle: 'Session Narrative',
    sessionNarrative: formState.sessionNarrative || '',
    
    signatureLabel: 'Signature:',
    signature: formState.signature || '',
    dateLabel: 'Date:',
    date: new Date().toLocaleDateString()
  }];
};

// Now updating the useSessionNoteForm to use the PDFme approach
export const createEmptySessionNoteTemplate = async (): Promise<Template> => {
  // This would ideally fetch from a template repository or create a dynamic template
  // For now, we're returning a static template structure
  return sessionNoteTemplate;
};
