
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';

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

// Generic PDF generator function
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
  try {
    // Format date for file naming
    const formattedDate = typeof documentInfo.documentDate === 'string' 
      ? documentInfo.documentDate 
      : documentInfo.documentDate.toISOString().split('T')[0];

    console.log('Generating PDF for:', documentInfo.documentTitle);
    
    // Determine which PDF document to render based on documentType
    let pdfDocument;
    
    switch (documentInfo.documentType) {
      case 'session_note':
        pdfDocument = <SessionNotePdfDocument formData={documentData} phq9Data={documentData.phq9Data} />;
        break;
      // Add other document types as needed
      default:
        console.error('Unsupported document type:', documentInfo.documentType);
        return null;
    }
    
    // Generate PDF as binary data
    const pdfBlob = await pdf(pdfDocument).toBlob();
    
    // Upload PDF to Supabase storage - Update the bucket name to match exactly what's in Supabase
    const filePath = `${documentInfo.clientId}/${documentInfo.documentType}/${formattedDate}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('Clinical Documents')  // Updated to match the bucket name in Supabase
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return null;
    }
    
    // Get the public URL - Update the bucket name here too
    const { data: urlData } = supabase.storage
      .from('Clinical Documents')  // Updated to match the bucket name in Supabase
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
    
    console.log('PDF generated successfully:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};
