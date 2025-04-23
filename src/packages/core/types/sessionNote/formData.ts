
/**
 * Session Note Form Data 
 * Represents the structure of data in the session note form
 */
export interface SessionNoteFormData {
  sessionDate: string;
  patientName: string;
  patientDOB: string;
  clinicianName: string;
  diagnosis: string[];
  planType: string;
  treatmentFrequency: string;
  medications: string;
  sessionType: string;
  personsInAttendance: string;
  
  // Mental Status fields
  appearance: string;
  attitude: string;
  behavior: string;
  speech: string;
  affect: string;
  thoughtProcess: string;
  perception: string;
  orientation: string;
  memoryConcentration: string;
  insightJudgement: string;
  mood: string;
  
  // Assessment fields
  substanceAbuseRisk: string;
  suicidalIdeation: string;
  homicidalIdeation: string;
  currentSymptoms: string;
  functioning: string;
  prognosis: string;
  progress: string;
  
  // Treatment goals and objectives
  primaryObjective: string;
  secondaryObjective: string;
  tertiaryObjective: string;
  intervention1: string;
  intervention2: string;
  intervention3: string;
  intervention4: string;
  intervention5: string;
  intervention6: string;
  problemNarrative: string;
  treatmentGoalNarrative: string;
  sessionNarrative: string;
  
  // Additional fields
  nextTreatmentPlanUpdate: string;
  signature: string;
  privateNote: string;
}
