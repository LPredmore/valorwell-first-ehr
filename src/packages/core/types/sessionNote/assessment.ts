
import { z } from 'zod';

export enum SubstanceAbuseRiskEnum {
  None = "None",
  Low = "Low",
  Medium = "Medium",
  High = "High"
}

export enum SuicidalIdeationEnum {
  None = "None",
  Passive = "Passive",
  Active = "Active"
}

export enum HomicidalIdeationEnum {
  None = "None",
  Passive = "Passive",
  Active = "Active"
}

export const assessmentSchema = z.object({
  substanceAbuseRisk: z.string().min(1, "Substance abuse risk assessment is required"),
  suicidalIdeation: z.string().min(1, "Suicidal ideation assessment is required"),
  homicidalIdeation: z.string().min(1, "Homicidal ideation assessment is required"),
  currentSymptoms: z.string().min(1, "Current symptoms are required"),
  functioning: z.string().min(1, "Functioning assessment is required"),
  prognosis: z.string().min(1, "Prognosis is required"),
  progress: z.string().min(1, "Progress assessment is required"),
  sessionNarrative: z.string().min(1, "Session narrative is required"),
});

export type AssessmentFormData = z.infer<typeof assessmentSchema>;
