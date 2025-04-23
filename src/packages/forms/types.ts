
/**
 * Form Types
 * 
 * This file contains types related to forms and assessments.
 */

// Basic assessment submission type
export interface AssessmentSubmission {
  clientId: string;
  appointmentId?: string;
  assessmentDate: string;
  totalScore?: number;
  additionalNotes?: string;
}

// PHQ-9 assessment
export interface PHQ9Submission extends AssessmentSubmission {
  question_1: number;
  question_2: number;
  question_3: number;
  question_4: number;
  question_5: number;
  question_6: number;
  question_7: number;
  question_8: number;
  question_9: number;
  phq9_narrative?: string;
}

// GAD-7 assessment
export interface GAD7Submission extends AssessmentSubmission {
  question_1: number;
  question_2: number;
  question_3: number;
  question_4: number;
  question_5: number;
  question_6: number;
  question_7: number;
  gad7_narrative?: string;
}
