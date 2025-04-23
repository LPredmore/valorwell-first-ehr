
import { RefObject } from 'react';
import { ClientDetails } from '@/packages/core/types/client';
import { 
  useSessionNoteState, 
  useSessionNoteValidation,
  useSessionNoteSave 
} from '@/packages/core/hooks/sessionNote';
import { usePHQ9Data } from '@/hooks/usePHQ9Data';

interface UseSessionNoteFormProps {
  clientData: ClientDetails | null;
  clinicianName: string;
  appointment?: any;
  onClose: () => void;
  contentRef?: RefObject<HTMLDivElement>;
}

export const useSessionNoteForm = ({
  clientData,
  clinicianName,
  appointment,
  onClose,
  contentRef
}: UseSessionNoteFormProps) => {
  const { formState, handleChange } = useSessionNoteState({
    clientData,
    clinicianName,
    appointment
  });

  const { validationErrors, isFormValid } = useSessionNoteValidation(formState);

  const { phq9Data } = usePHQ9Data(
    clientData?.id,
    appointment?.date ? new Date(appointment.date).toISOString().split('T')[0] : undefined
  );

  const { handleSave, isSubmitting } = useSessionNoteSave({
    clientData,
    formState,
    isFormValid,
    appointment,
    contentRef,
    onClose
  });

  return {
    formState,
    handleChange,
    handleSave,
    isSubmitting,
    phq9Data,
    validationErrors,
    isFormValid
  };
};
