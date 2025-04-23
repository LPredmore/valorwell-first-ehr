
import { z } from 'zod';

// Re-export all form-related types
export * from '@/packages/core/types/sessionNote';

export interface FormData {
  // Base form data interface
  id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface FormValidation {
  schema?: z.ZodSchema;
  validate?: (data: any) => boolean;
  errors?: string[];
}

export interface PHQ9Question {
  id: number;
  text: string;
  score: number;
}

export interface GAD7Question {
  id: number;
  text: string;
  score: number;
  field: string;
}

export interface TabProps {
  formData: any;
  handleInputChange: (field: string, value: string | string[] | boolean) => void;
  isEditing: boolean;
  form?: any;
  clinicians?: any[];
  clientData?: any;
  handleAddDiagnosis?: (diagnosis: string) => void;
  handleRemoveDiagnosis?: (index: number) => void;
}

export interface SessionNoteTemplateProps {
  onClose: () => void;
  appointment?: any;
  clinicianName?: string;
  clientData?: any;
}
