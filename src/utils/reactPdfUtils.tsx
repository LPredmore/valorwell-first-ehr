import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

// Define document styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
    borderBottom: '1px solid #eaeaea',
    paddingBottom: 10,
  },
  subheader: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 5,
    width: '30%',
  },
  value: {
    width: '70%',
  },
  clientInfo: {
    marginBottom: 20,
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
  },
  narrative: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 10,
    lineHeight: 1.4,
  },
  sectionMargin: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: 'grey',
  },
  signature: {
    marginTop: 30,
    borderTop: '1px solid black',
    paddingTop: 5,
    fontSize: 10,
    width: '50%',
  },
  diagnosisList: {
    marginTop: 5,
    marginBottom: 5,
    fontSize: 10,
  }
});

// Register default fonts if needed
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/font/lib/assets/Helvetica.ttf' },
    { 
      src: 'https://cdn.jsdelivr.net/npm/@react-pdf/font/lib/assets/Helvetica-Bold.ttf', 
      fontWeight: 'bold',
      fontStyle: 'normal',
      // Remove the fontFamily property as it's not allowed in FontSource
    }
  ]
});

// Register the bold font separately
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdn.jsdelivr.net/npm/@react-pdf/font/lib/assets/Helvetica-Bold.ttf',
  fontWeight: 'bold'
});

// Splits text into chunks to avoid overflow
interface SplitTextProps {
  text?: string;
  style?: any;
}

const SplitText: React.FC<SplitTextProps> = ({ text = "", style = {} }) => {
  // If the text is empty or just whitespace, don't render anything
  if (!text || text.trim() === '') {
    return null;
  }
  
  return (
    <Text style={style}>
      {text}
    </Text>
  );
};

// Generic label-value pair component
interface LabeledFieldProps {
  label: string;
  value: string | number | null | undefined;
}

const LabeledField: React.FC<LabeledFieldProps> = ({ label, value }) => (
  <View style={styles.contentRow}>
    <Text style={styles.label}>{label}:</Text>
    <SplitText text={value?.toString()} style={styles.value} />
  </View>
);

// Create Session Note PDF
interface SessionNotePdfDocumentProps {
  formData: any;
  phq9Data?: any;
}

const SessionNotePdfDocument: React.FC<SessionNotePdfDocumentProps> = ({ formData, phq9Data = null }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Therapy Session Note</Text>
      
      {/* Client Information Section */}
      <View style={styles.clientInfo}>
        <LabeledField label="Client Name" value={formData.patientName} />
        <LabeledField label="Client DOB" value={formData.patientDOB} />
        <LabeledField label="Session Date" value={formData.sessionDate} />
        <LabeledField label="Clinician Name" value={formData.clinicianName} />
        <LabeledField label="Session Type" value={formData.sessionType} />
      </View>
      
      {/* Mental Status Section */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Mental Status Examination</Text>
        <LabeledField label="Appearance" value={formData.appearance} />
        <LabeledField label="Attitude" value={formData.attitude} />
        <LabeledField label="Behavior" value={formData.behavior} />
        <LabeledField label="Speech" value={formData.speech} />
        <LabeledField label="Affect" value={formData.affect} />
        <LabeledField label="Thought Process" value={formData.thoughtProcess} />
        <LabeledField label="Perception" value={formData.perception} />
        <LabeledField label="Orientation" value={formData.orientation} />
        <LabeledField label="Memory/Concentration" value={formData.memoryConcentration} />
        <LabeledField label="Insight/Judgement" value={formData.insightJudgement} />
        <LabeledField label="Mood" value={formData.mood} />
        <LabeledField label="Substance Abuse Risk" value={formData.substanceAbuseRisk} />
        <LabeledField label="Suicidal Ideation" value={formData.suicidalIdeation} />
        <LabeledField label="Homicidal Ideation" value={formData.homicidalIdeation} />
      </View>
      
      {/* Problem & Treatment Goals - Conditionally shown */}
      {(formData.problemNarrative || formData.treatmentGoalNarrative) && (
        <View style={styles.sectionMargin}>
          <Text style={styles.subheader}>Problem & Treatment Goals</Text>
          {formData.problemNarrative && (
            <View style={styles.section}>
              <Text style={styles.label}>Problem Narrative:</Text>
              <SplitText text={formData.problemNarrative} style={styles.narrative} />
            </View>
          )}
          {formData.treatmentGoalNarrative && (
            <View style={styles.section}>
              <Text style={styles.label}>Treatment Goal Narrative:</Text>
              <SplitText text={formData.treatmentGoalNarrative} style={styles.narrative} />
            </View>
          )}
        </View>
      )}
      
      {/* Treatment Objectives */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Treatment Objectives & Interventions</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Primary Objective:</Text>
          <SplitText text={formData.primaryObjective} style={styles.narrative} />
          <LabeledField label="Intervention 1" value={formData.intervention1} />
          <LabeledField label="Intervention 2" value={formData.intervention2} />
        </View>
        
        {formData.secondaryObjective && (
          <View style={styles.section}>
            <Text style={styles.label}>Secondary Objective:</Text>
            <SplitText text={formData.secondaryObjective} style={styles.narrative} />
            <LabeledField label="Intervention 3" value={formData.intervention3} />
            <LabeledField label="Intervention 4" value={formData.intervention4} />
          </View>
        )}
        
        {formData.tertiaryObjective && (
          <View style={styles.section}>
            <Text style={styles.label}>Tertiary Objective:</Text>
            <SplitText text={formData.tertiaryObjective} style={styles.narrative} />
            <LabeledField label="Intervention 5" value={formData.intervention5} />
            <LabeledField label="Intervention 6" value={formData.intervention6} />
          </View>
        )}
      </View>
      
      {/* PHQ-9 Assessment if available */}
      {phq9Data && (
        <View style={styles.sectionMargin}>
          <Text style={styles.subheader}>PHQ-9 Assessment</Text>
          <LabeledField label="Score" value={phq9Data.total_score} />
        </View>
      )}
      
      {/* Session Assessment */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Session Assessment</Text>
        <LabeledField label="Current Symptoms" value={formData.currentSymptoms} />
        <LabeledField label="Functioning" value={formData.functioning} />
        <LabeledField label="Prognosis" value={formData.prognosis} />
        <LabeledField label="Progress" value={formData.progress} />
      </View>
      
      {/* Session Narrative */}
      {formData.sessionNarrative && (
        <View style={styles.sectionMargin}>
          <Text style={styles.subheader}>Session Narrative</Text>
          <SplitText text={formData.sessionNarrative} style={styles.narrative} />
        </View>
      )}
      
      {/* Plan and Signature */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Plan & Signature</Text>
        <LabeledField label="Next Treatment Plan Update" value={formData.nextTreatmentPlanUpdate} />
        {formData.signature && (
          <View style={styles.signature}>
            <Text>{formData.signature}</Text>
            <Text style={styles.text}>{formData.clinicianName}</Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);

// New component for Treatment Plan PDF
interface TreatmentPlanPdfDocumentProps {
  formData: any;
}

const TreatmentPlanPdfDocument: React.FC<TreatmentPlanPdfDocumentProps> = ({ formData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Therapy Treatment Plan</Text>
      
      {/* Client Information Section */}
      <View style={styles.clientInfo}>
        <LabeledField label="Client Name" value={formData.clientName} />
        <LabeledField label="Client DOB" value={formData.clientDob} />
        <LabeledField label="Treatment Plan Start Date" value={formData.startDate ? formData.startDate.toLocaleDateString() : ''} />
        <LabeledField label="Clinician Name" value={formData.clinicianName} />
        <LabeledField label="Plan Length" value={formData.planLength} />
        <LabeledField label="Treatment Frequency" value={formData.treatmentFrequency} />
      </View>
      
      {/* Diagnosis Section */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Diagnosis</Text>
        {Array.isArray(formData.diagnosisCodes) && formData.diagnosisCodes.length > 0 ? (
          formData.diagnosisCodes.map((code: string, index: number) => (
            <Text key={index} style={styles.diagnosisList}>• {code}</Text>
          ))
        ) : (
          <Text style={styles.text}>No diagnosis codes provided</Text>
        )}
      </View>
      
      {/* Problem & Treatment Goals */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Problem & Treatment Goals</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Problem Narrative:</Text>
          <SplitText text={formData.problemNarrative} style={styles.narrative} />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Treatment Goal Narrative:</Text>
          <SplitText text={formData.treatmentGoalNarrative} style={styles.narrative} />
        </View>
      </View>
      
      {/* Treatment Objectives */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Treatment Objectives & Interventions</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Primary Objective:</Text>
          <SplitText text={formData.primaryObjective} style={styles.narrative} />
          <LabeledField label="Intervention 1" value={formData.intervention1} />
          <LabeledField label="Intervention 2" value={formData.intervention2} />
        </View>
        
        {formData.secondaryObjective && (
          <View style={styles.section}>
            <Text style={styles.label}>Secondary Objective:</Text>
            <SplitText text={formData.secondaryObjective} style={styles.narrative} />
            <LabeledField label="Intervention 3" value={formData.intervention3} />
            <LabeledField label="Intervention 4" value={formData.intervention4} />
          </View>
        )}
        
        {formData.tertiaryObjective && (
          <View style={styles.section}>
            <Text style={styles.label}>Tertiary Objective:</Text>
            <SplitText text={formData.tertiaryObjective} style={styles.narrative} />
            <LabeledField label="Intervention 5" value={formData.intervention5} />
            <LabeledField label="Intervention 6" value={formData.intervention6} />
          </View>
        )}
      </View>
      
      {/* Plan and Review */}
      <View style={styles.sectionMargin}>
        <Text style={styles.subheader}>Plan & Review</Text>
        <LabeledField label="Next Treatment Plan Update" value={formData.nextUpdate} />
      </View>
    </Page>
  </Document>
);

// Enhanced error handling for storage operations
const handleStorageOperation = async (operation: () => Promise<any>, errorMessage: string) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    toast({
      title: "Storage Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

// Generic PDF generator function with improved error handling
export const generateAndSavePDF = async (
  documentData: any,
  documentInfo: {
    clientId: string;
    documentType: string;
    documentDate: string | Date;
    documentTitle: string;
    createdBy?: string;
  }
) => {
  // Format date for file naming
  const formattedDate = typeof documentInfo.documentDate === 'string' 
    ? documentInfo.documentDate 
    : documentInfo.documentDate.toISOString().split('T')[0];

  console.log('Generating PDF for:', documentInfo.documentTitle);
  
  try {
    // Step 1: Generate PDF - Enhanced error handling
    let pdfDocument;
    let pdfBlob;
    
    try {
      // Determine which PDF document to render based on documentType
      switch (documentInfo.documentType) {
        case 'session_note':
          pdfDocument = <SessionNotePdfDocument formData={documentData} phq9Data={documentData.phq9Data} />;
          break;
        case 'treatment_plan':
          pdfDocument = <TreatmentPlanPdfDocument formData={documentData} />;
          break;
        default:
          throw new Error(`Unsupported document type: ${documentInfo.documentType}`);
      }
      
      // Generate PDF as binary data
      pdfBlob = await pdf(pdfDocument).toBlob();
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate the PDF document. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: pdfError, step: 'pdf_generation' };
    }
    
    // Step 2: Upload PDF to storage - With retry logic
    const filePath = `${documentInfo.clientId}/${documentInfo.documentType}/${formattedDate}-${Date.now()}.pdf`;
    let uploadAttempts = 0;
    let uploadError = null;
    
    // Define storage bucket name according to document type
    const bucketName = "session-notes";
    
    while (uploadAttempts < 3) {
      try {
        console.log(`Attempting to upload PDF to ${bucketName} bucket, path:`, filePath);
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });
          
        if (!error) {
          uploadError = null;
          console.log('PDF uploaded successfully');
          break;
        }
        
        uploadError = error;
        uploadAttempts++;
        console.log(`Upload attempt ${uploadAttempts} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      } catch (error) {
        uploadError = error;
        uploadAttempts++;
        console.error('Upload attempt failed with exception:', error);
      }
    }
    
    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      toast({
        title: "Upload Failed",
        description: "Could not upload the document. Please try again later.",
        variant: "destructive",
      });
      return { success: false, error: uploadError, step: 'storage_upload' };
    }
    
    // Step 3: Get the public URL
    let urlData;
    try {
      const response = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      urlData = response.data;
    } catch (urlError) {
      console.error('Error getting public URL:', urlError);
      // Continue with the process even if getting URL fails
    }
    
    // Step 4: Save document metadata to clinical_documents table with error handling
    try {
      console.log('Saving document metadata to clinical_documents table:', {
        client_id: documentInfo.clientId,
        document_type: documentInfo.documentType,
        document_date: formattedDate,
        document_title: documentInfo.documentTitle,
        file_path: filePath,
        created_by: documentInfo.createdBy
      });
      
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
        toast({
          title: "Warning",
          description: "Document was uploaded but metadata could not be saved.",
          variant: "default",
        });
        return { success: true, filePath, warning: 'metadata_not_saved' };
      }
    } catch (dbException) {
      console.error('Exception saving document metadata:', dbException);
      toast({
        title: "Warning",
        description: "Document was uploaded but metadata could not be saved.",
        variant: "default",
      });
      return { success: true, filePath, warning: 'metadata_not_saved', error: dbException };
    }
    
    console.log('PDF generated and stored successfully:', filePath);
    return { success: true, filePath };
  } catch (error) {
    // Catch-all for any unhandled errors
    console.error('Unexpected error in generateAndSavePDF:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return { success: false, error };
  }
};
