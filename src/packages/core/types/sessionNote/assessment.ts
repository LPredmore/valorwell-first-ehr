
export interface SessionAssessment {
  substanceAbuseRisk: string | null;
  suicidalIdeation: string | null;
  homicidalIdeation: string | null;
  functioning: string | null;
  prognosis: string | null;
  progress: string | null;
  sessionNarrative: string | null;
  medications: string | null;
  personsInAttendance: string | null;
  currentSymptoms: string | null;
}

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
