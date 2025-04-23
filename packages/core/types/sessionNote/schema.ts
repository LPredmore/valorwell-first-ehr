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
  
  // Objectives - making all treatment goal fields optional
  primaryObjective: z.string().optional(),
  intervention1: z.string().optional(),
  intervention2: z.string().optional(),
  secondaryObjective: z.string().optional(),
  intervention3: z.string().optional(),
  intervention4: z.string().optional(),
  tertiaryObjective: z.string().optional(),
  intervention5: z.string().optional(),
  intervention6: z.string().optional(),
  
  // Assessment - keeping required fields
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
