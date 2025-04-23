import { z } from 'zod';

// We'll make the validation more specific and add custom error messages
const nonEmptyString = z.string().min(1, "This field cannot be empty").transform(val => val.trim());

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
  
  // Mental Status - all fields required
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
  
  // Objectives - all fields required
  primaryObjective: nonEmptyString,
  intervention1: nonEmptyString,
  intervention2: nonEmptyString,
  secondaryObjective: nonEmptyString,
  intervention3: nonEmptyString,
  intervention4: nonEmptyString,
  tertiaryObjective: nonEmptyString,
  intervention5: nonEmptyString,
  intervention6: nonEmptyString,
  
  // Assessment - all fields required
  currentSymptoms: nonEmptyString,
  functioning: nonEmptyString,
  prognosis: nonEmptyString,
  progress: nonEmptyString,
  problemNarrative: z.string().optional(),
  treatmentGoalNarrative: z.string().optional(),
  sessionNarrative: nonEmptyString,
  nextTreatmentPlanUpdate: nonEmptyString,
  signature: nonEmptyString,
  
  // Optional field
  privateNote: z.string().optional(),
});

export type SessionNoteFormData = z.infer<typeof sessionNoteSchema>;
