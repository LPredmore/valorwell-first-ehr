
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define the styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 15,
    fontFamily: 'Helvetica-Bold',
  },
  text: {
    fontSize: 10,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 15,
  },
  signature: {
    marginTop: 30,
    borderTop: '1px solid black',
    paddingTop: 5,
    fontSize: 10,
    width: '50%',
  },
  date: {
    fontSize: 10,
    marginTop: 5,
  },
});

// Register the fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@react-pdf/font/lib/assets/Helvetica.ttf' },
    { 
      src: 'https://cdn.jsdelivr.net/npm/@react-pdf/font/lib/assets/Helvetica-Bold.ttf', 
      fontWeight: 'bold',
      fontStyle: 'normal',
    }
  ]
});

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdn.jsdelivr.net/npm/@react-pdf/font/lib/assets/Helvetica-Bold.ttf',
  fontWeight: 'bold'
});

interface InformedConsentPdfDocumentProps {
  formData: {
    clientName: string;
    signature: string;
    signatureDate: string;
  };
}

const InformedConsentPdfDocument: React.FC<InformedConsentPdfDocumentProps> = ({ formData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Informed Consent for Telehealth Services</Text>
      
      <View style={styles.section}>
        <Text style={styles.text}>
          This form provides information about engaging in therapy services via telehealth. 
          Please read it carefully and let your provider know if you have any questions.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>What Is Telehealth?</Text>
        <Text style={styles.text}>
          Telehealth involves the use of electronic communications to provide behavioral health services remotely. 
          This may include real-time video conferencing, phone calls, or other secure communication tools. 
          Telehealth allows for the delivery of therapy services without an in-person visit.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Technology and Privacy</Text>
        <Text style={styles.text}>
          Our telehealth sessions will be conducted through our own proprietary health record system, 
          which is HIPAA-compliant and encrypted to protect your privacy. Clinical notes from telehealth 
          sessions will be maintained in a secure, HIPAA-compliant electronic health record. Clients may 
          request access to their records in accordance with applicable law.
        </Text>
        <Text style={styles.text}>
          While we use best practices to maintain privacy and data security, telehealth carries inherent 
          risks, including the potential for technical failure, unauthorized access, and loss of confidentiality. 
          You acknowledge and accept these risks.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Benefits and Limitations</Text>
        <Text style={styles.text}>
          Telehealth offers increased accessibility and convenience. However, it may not be appropriate 
          in all situations. Your provider will assess whether telehealth is a suitable form of care for 
          your specific needs. If at any time telehealth is deemed clinically inappropriate, alternative 
          arrangements may be recommended.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Client Responsibilities</Text>
        <Text style={styles.text}>
          To maintain the effectiveness and confidentiality of telehealth sessions, clients agree to conduct 
          sessions in a private, distraction-free environment. Clients will not attend sessions while operating 
          a vehicle.
        </Text>
        <Text style={styles.text}>
          You are responsible for ensuring a stable internet connection and appropriate technology for video 
          or phone sessions. You agree to take steps to secure your own devices and communication channels 
          (e.g., using a private internet connection and updated security software).
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Emergencies and Crisis Situations</Text>
        <Text style={styles.text}>
          In the event of a crisis or emergency, you agree to contact emergency services (911) or go to the 
          nearest emergency room. You also agree to inform your provider of your physical location at the 
          beginning of each session in case emergency services need to be contacted.
        </Text>
        <Text style={styles.text}>
          Please note that telehealth is not appropriate for all emergency situations, and your provider may 
          not be able to provide immediate crisis support remotely.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Confidentiality</Text>
        <Text style={styles.text}>
          Information shared in telehealth sessions is confidential and subject to the same limitations and 
          protections as in-person therapy. These include exceptions required by law, such as the duty to report 
          imminent risk of harm to self or others, suspected abuse, or court-ordered disclosures.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Voluntary Participation and Withdrawal</Text>
        <Text style={styles.text}>
          Participation in telehealth is voluntary. You have the right to withdraw your consent to telehealth 
          services at any time without affecting your right to future care or treatment.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subheader}>Acknowledgment and Consent</Text>
        <Text style={styles.text}>
          By signing below, you acknowledge that you have read and understood the information provided above. 
          You consent to engage in telehealth services under the terms described.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.text}>Client Name: {formData.clientName}</Text>
        <View style={styles.signature}>
          <Text>{formData.signature}</Text>
          <Text style={styles.date}>Date: {formData.signatureDate}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default InformedConsentPdfDocument;
