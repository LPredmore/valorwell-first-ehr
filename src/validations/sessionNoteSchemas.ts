
import { z } from 'zod';

const nonEmptyString = z.string().min(1, "This field is required").transform(val => val.trim());

export const sessionNoteSchema = z.object({
  sessionDate: z.string().min(1, "Session date is required"),
  patientName: nonEmptyString,
  patientDOB: nonEmptyString,
  clinicianName: nonEmptyString,
  diagnosis: z.array(z.string()).min(1, "At least one diagnosis is required"),
  planType: nonEmptyString,
  treatmentFrequency: nonEmptyString,
  medications: nonEmptyString,
  sessionType: nonEmptyString,
  personsInAttendance: nonEmptyString,
  
  // Mental Status
  appearance: nonEmptyString,
  attitude: nonEmptyString,
  behavior: nonEmptyString,
  speech: nonEmptyString,
  affect: nonEmptyString,
  thoughtProcess: nonEmptyString,
  perception: nonEmptyString,
  orientation: nonEmptyString,
  memoryConcentration: nonEmptyString,
  insightJudgement: nonEmptyString,
  mood: nonEmptyString,
  substanceAbuseRisk: nonEmptyString,
  suicidalIdeation: nonEmptyString,
  homicidalIdeation: nonEmptyString,
  
  // Objectives
  primaryObjective: nonEmptyString,
  intervention1: nonEmptyString,
  intervention2: nonEmptyString,
  secondaryObjective: nonEmptyString,
  intervention3: nonEmptyString,
  intervention4: nonEmptyString,
  tertiaryObjective: nonEmptyString,
  intervention5: nonEmptyString,
  intervention6: nonEmptyString,
  
  // Assessment
  currentSymptoms: nonEmptyString,
  functioning: nonEmptyString,
  prognosis: nonEmptyString,
  progress: nonEmptyString,
  problemNarrative: nonEmptyString,
  treatmentGoalNarrative: nonEmptyString,
  sessionNarrative: nonEmptyString,
  nextTreatmentPlanUpdate: nonEmptyString,
  signature: nonEmptyString,
  
  // Optional
  privateNote: z.string().optional(),
});

export type SessionNoteFormData = z.infer<typeof sessionNoteSchema>;
