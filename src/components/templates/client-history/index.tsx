
import React from 'react';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { ClientData } from "@/hooks/useClientData";
import PersonalInfoSection from "./PersonalInfoSection";
import EmergencyContactSection from "./EmergencyContactSection";
import FamilyMembersSection from "./FamilyMembersSection";
import HouseholdMembersSection from "./HouseholdMembersSection";
import PresentingProblemsSection from "./PresentingProblemsSection";
import MedicalHistorySection from "./MedicalHistorySection";
import MentalHealthHistorySection from "./MentalHealthHistorySection";
import DevelopmentalHistorySection from "./DevelopmentalHistorySection";
import SocialHistorySection from "./SocialHistorySection";

export interface ClientHistoryFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    preferredName: string;
    dateOfBirth?: Date;
    gender: string;
    sexualOrientation: string;
    relationshipStatus: string;
    livingSituation: string;
    occupation: string;
    educationLevel: string;
    primaryLanguage: string;
    secondaryLanguage: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
  };
  familyMembers: Array<{
    name: string;
    relationshipType: string;
    dateOfBirth?: string;
    livingStatus: string;
    occupation: string;
    educationLevel: string;
    significantHistory: string;
  }>;
  householdMembers: Array<{
    name: string;
    relationshipType: string;
    dateOfBirth?: string;
    livingStatus: string;
    occupation: string;
    educationLevel: string;
    significantHistory: string;
  }>;
  presentingProblems: {
    chiefComplaint: string;
    symptoms: string;
    triggers: string;
    duration: string;
    severity: string;
    impactOnFunctioning: string;
    previousTreatment: string;
    currentTreatment: string;
    goalsForTreatment: string;
  };
  medicalHistory: {
    currentMedications: string;
    allergies: string;
    chronicIllnesses: string;
    pastHospitalizations: string;
    surgeries: string;
    immunizationStatus: string;
    sleepPatterns: string;
    dietaryHabits: string;
    exercisePatterns: string;
    substanceUse: string;
  };
  mentalHealthHistory: {
    previousDiagnoses: string;
    previousTherapy: string;
    previousMedications: string;
    hospitalizations: string;
    suicideAttempts: string;
    selfHarmBehaviors: string;
    traumaHistory: string;
    familyMentalHealthHistory: string;
  };
  developmentalHistory: {
    earlyChildhood: string;
    milestones: string;
    schoolExperience: string;
    socialRelationships: string;
    significantEvents: string;
  };
  socialHistory: {
    culturalBackground: string;
    religiousBeliefs: string;
    communityInvolvement: string;
    legalIssues: string;
    financialSituation: string;
    militaryService: string;
    relationshipHistory: string;
    socialSupport: string;
  };
  // Adding remaining form sections as needed
  vocationalHistory: {
    employmentHistory: string;
    jobSatisfaction: string;
    careerGoals: string;
    workEnvironment: string;
  };
  educationalHistory: {
    academicPerformance: string;
    learningStyle: string;
    specialEducation: string;
    educationalGoals: string;
  };
  riskAssessment: {
    suicideRisk: string;
    homicideRisk: string;
    selfNeglectRisk: string;
    vulnerabilityRisk: string;
  };
  strengthsResources: {
    personalStrengths: string;
    supportSystem: string;
    copingSkills: string;
    communityResources: string;
  };
  culturalConsiderations: {
    culturalBackground: string;
    languageBarriers: string;
    culturalBeliefs: string;
    discriminationExperiences: string;
  };
  additionalInformation: {
    anythingElse: string;
  };
  signature?: string;
  isFamilySameAsHousehold?: boolean;
}

interface ClientHistoryTemplateProps {
  onSubmit: (data: ClientHistoryFormData) => void;
  isSubmitting: boolean;
  clientData?: ClientData | null;
}

const ClientHistoryTemplate: React.FC<ClientHistoryTemplateProps> = ({
  onSubmit,
  isSubmitting,
  clientData
}) => {
  const form = useForm<ClientHistoryFormData>({
    defaultValues: {
      personalInfo: {
        firstName: clientData?.client_first_name || '',
        lastName: clientData?.client_last_name || '',
        preferredName: clientData?.client_preferred_name || '',
        gender: clientData?.client_gender || '',
        sexualOrientation: '',
        relationshipStatus: '',
        livingSituation: '',
        occupation: '',
        educationLevel: '',
        primaryLanguage: '',
        secondaryLanguage: '',
        email: clientData?.client_email || '',
        phone: clientData?.client_phone || '',
        address: '',
        city: '',
        state: clientData?.client_state || '',
        zipCode: '',
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: '',
        address: '',
      },
      familyMembers: [{
        name: '',
        relationshipType: '',
        dateOfBirth: '',
        livingStatus: '',
        occupation: '',
        educationLevel: '',
        significantHistory: '',
      }],
      householdMembers: [{
        name: '',
        relationshipType: '',
        dateOfBirth: '',
        livingStatus: '',
        occupation: '',
        educationLevel: '',
        significantHistory: '',
      }],
      presentingProblems: {
        chiefComplaint: '',
        symptoms: '',
        triggers: '',
        duration: '',
        severity: '',
        impactOnFunctioning: '',
        previousTreatment: '',
        currentTreatment: '',
        goalsForTreatment: '',
      },
      medicalHistory: {
        currentMedications: '',
        allergies: '',
        chronicIllnesses: '',
        pastHospitalizations: '',
        surgeries: '',
        immunizationStatus: '',
        sleepPatterns: '',
        dietaryHabits: '',
        exercisePatterns: '',
        substanceUse: '',
      },
      mentalHealthHistory: {
        previousDiagnoses: '',
        previousTherapy: '',
        previousMedications: '',
        hospitalizations: '',
        suicideAttempts: '',
        selfHarmBehaviors: '',
        traumaHistory: '',
        familyMentalHealthHistory: '',
      },
      developmentalHistory: {
        earlyChildhood: '',
        milestones: '',
        schoolExperience: '',
        socialRelationships: '',
        significantEvents: '',
      },
      socialHistory: {
        culturalBackground: '',
        religiousBeliefs: '',
        communityInvolvement: '',
        legalIssues: '',
        financialSituation: '',
        militaryService: '',
        relationshipHistory: '',
        socialSupport: '',
      },
      vocationalHistory: {
        employmentHistory: '',
        jobSatisfaction: '',
        careerGoals: '',
        workEnvironment: '',
      },
      educationalHistory: {
        academicPerformance: '',
        learningStyle: '',
        specialEducation: '',
        educationalGoals: '',
      },
      riskAssessment: {
        suicideRisk: '',
        homicideRisk: '',
        selfNeglectRisk: '',
        vulnerabilityRisk: '',
      },
      strengthsResources: {
        personalStrengths: '',
        supportSystem: '',
        copingSkills: '',
        communityResources: '',
      },
      culturalConsiderations: {
        culturalBackground: '',
        languageBarriers: '',
        culturalBeliefs: '',
        discriminationExperiences: '',
      },
      additionalInformation: {
        anythingElse: '',
      }
    }
  });

  const handleFormSubmit = (data: ClientHistoryFormData) => {
    onSubmit(data);
  };

  return (
    <div id="client-history-form">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <PersonalInfoSection form={form} />
        <EmergencyContactSection form={form} />
        <FamilyMembersSection form={form} />
        <HouseholdMembersSection form={form} />
        <PresentingProblemsSection form={form} />
        <MedicalHistorySection form={form} />
        <MentalHealthHistorySection form={form} />
        <DevelopmentalHistorySection form={form} />
        <SocialHistorySection form={form} />

        {/* Additional sections can be added here */}
        
        <div className="flex justify-end mt-8">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Client History"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClientHistoryTemplate;
