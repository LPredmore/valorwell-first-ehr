
export interface MentalStatusAssessment {
  appearance: string | null;
  attitude: string | null;
  behavior: string | null;
  speech: string | null;
  affect: string | null;
  thoughtProcess: string | null;
  perception: string | null;
  orientation: string | null;
  memoryConcentration: string | null;
  insightJudgement: string | null;
  mood: string | null;
}

// Mental Status Enums
export * from './mentalStatusEnums';
