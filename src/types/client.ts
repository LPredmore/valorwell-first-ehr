
// Re-export client types from core package
export * from '@/packages/core/types/client';

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
