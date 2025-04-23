
// Re-export client types from core package
export * from '@/packages/core/types/client';

// Additional types needed for legacy components
export interface TabProps {
  isEditing: boolean;
  form: any;
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
