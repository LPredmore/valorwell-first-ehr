
/**
 * Base interface for assessment questions
 */
interface BaseQuestion {
  id: number;
  text: string;
  score: number;
  field: string;
}

/**
 * Represents a question in a PHQ-9 assessment
 */
export interface PHQ9Question extends BaseQuestion {}

/**
 * Represents a question in a GAD-7 assessment 
 */
export interface GAD7Question extends BaseQuestion {}
