
import { useState, useEffect } from 'react';
import { sessionNoteSchema } from '../../types/sessionNote';

export const useSessionNoteValidation = (formState: any) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const validationResult = sessionNoteSchema.safeParse(formState);
    setIsFormValid(validationResult.success);
    setValidationErrors(
      validationResult.success 
        ? [] 
        : validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    );
  }, [formState]);

  return {
    validationErrors,
    isFormValid
  };
};
