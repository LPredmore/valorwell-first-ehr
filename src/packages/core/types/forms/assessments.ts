
/**
 * Represents a question in a PHQ-9 assessment
 */
export interface PHQ9Question {
  id: number;
  text: string;
  score: number;
  field?: string;
}

/**
 * Represents a question in a GAD-7 assessment 
 */
export interface GAD7Question {
  id: number;
  text: string;
  score: number;
  field: string;
}
