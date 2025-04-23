export * from './mentalStatus';
export * from './assessment';
export * from './formData';

import { z } from 'zod';

/**
 * Zod schema for session note validation
 * This is used to validate session note form data before submission
 */
export const sessionNoteSchema = z.object({
  sessionDate: z.string().min(1, "Session date is required"),
  patientName: z.string().min(1, "Patient name is required"),
  patientDOB: z.string(),
  clinicianName: z.string().min(1, "Clinician name is required"),
  diagnosis: z.array(z.string()).optional().default([]),
  planType: z.string(),
  treatmentFrequency: z.string(),
  sessionType: z.string().min(1, "Session type is required"),
  // Mental status fields
  appearance: z.string().optional().nullable(),
  attitude: z.string().optional().nullable(),
  behavior: z.string().optional().nullable(),
  speech: z.string().optional().nullable(),
  affect: z.string().optional().nullable(),
  thoughtProcess: z.string().optional().nullable(),
  perception: z.string().optional().nullable(),
  orientation: z.string().optional().nullable(),
  memoryConcentration: z.string().optional().nullable(),
  insightJudgement: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  // Assessment fields
  substanceAbuseRisk: z.string().optional().nullable(),
  suicidalIdeation: z.string().optional().nullable(),
  homicidalIdeation: z.string().optional().nullable(),
  functioning: z.string().optional().nullable(),
  prognosis: z.string().optional().nullable(),
  progress: z.string().optional().nullable(),
  // Narratives
  problemNarrative: z.string().optional().nullable(),
  treatmentGoalNarrative: z.string().optional().nullable(),
  sessionNarrative: z.string().min(1, "Session narrative is required"),
  // Other fields
  medications: z.string().optional().nullable(),
  personsInAttendance: z.string().optional().nullable(),
  currentSymptoms: z.string().optional().nullable(),
  // Treatment goals and interventions
  primaryObjective: z.string().optional().nullable(),
  intervention1: z.string().optional().nullable(),
  intervention2: z.string().optional().nullable(),
  secondaryObjective: z.string().optional().nullable(),
  intervention3: z.string().optional().nullable(),
  intervention4: z.string().optional().nullable(),
  tertiaryObjective: z.string().optional().nullable(),
  intervention5: z.string().optional().nullable(),
  intervention6: z.string().optional().nullable(),
  nextTreatmentPlanUpdate: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  privateNote: z.string().optional().nullable(),
});
