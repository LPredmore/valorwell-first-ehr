
/**
 * Form Validation
 * 
 * This module contains utilities for validating form data.
 */

import { z } from 'zod';

// Re-export the session note schema
export { sessionNoteSchema } from '@/packages/core/types/sessionNote';

// PHQ-9 validation schema
export const phq9Schema = z.object({
  clientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  assessmentDate: z.string().min(1),
  question_1: z.number().min(0).max(3),
  question_2: z.number().min(0).max(3),
  question_3: z.number().min(0).max(3),
  question_4: z.number().min(0).max(3),
  question_5: z.number().min(0).max(3),
  question_6: z.number().min(0).max(3),
  question_7: z.number().min(0).max(3),
  question_8: z.number().min(0).max(3),
  question_9: z.number().min(0).max(3),
  totalScore: z.number(),
  phq9_narrative: z.string().optional(),
  additionalNotes: z.string().optional(),
});
