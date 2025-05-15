
export interface EmergencyContactData {
  name: string;
  relationship: string;
  phone: string;
}

export interface FamilyMemberData {
  id: string;
  relationshipType: string;
  name: string;
  personality: string;
  relationshipGrowing?: string;
  relationshipNow: string;
}

export interface HouseholdMemberData {
  id: string;
  relationshipType: string;
  name: string;
  personality: string;
  relationshipNow: string;
}

export interface SpouseData {
  name: string;
  personality: string;
  relationship: string;
}

export interface TreatmentData {
  id: string;
  year: string;
  reason: string;
  length: string;
  provider: string;
}

export interface MedicationData {
  id: string;
  name: string;
  purpose: string;
  duration: string;
}

export interface ClientHistoryFormData {
  emergencyContact: EmergencyContactData;
  currentIssues: string;
  progressionOfIssues: string;
  symptoms: string[];
  hospitalizedPsychiatric: boolean;
  attemptedSuicide: boolean;
  psychHold: boolean;
  lifeChanges: string;
  additionalInfo: string;
  counselingGoals: string;
  childhoodExperiences: string[];
  childhoodElaboration: string;
  isFamilySameAsHousehold: boolean;
  familyMembers: FamilyMemberData[];
  householdMembers: HouseholdMemberData[];
  occupationDetails: string;
  educationLevel: string;
  isMarried: boolean;
  currentSpouse: SpouseData | null;
  hasPastSpouses: boolean;
  pastSpouses: SpouseData[];
  relationshipProblems: string;
  hasReceivedTreatment: boolean;
  pastTreatments: TreatmentData[];
  medicalConditions: string[];
  chronicHealthProblems: string;
  sleepHours: string;
  alcoholUse: string;
  tobaccoUse: string;
  drugUse: string;
  takesMedications: boolean;
  medications: MedicationData[];
  personalStrengths: string;
  hobbies: string;
  additionalInfo2: string;
  signature: string;
}
