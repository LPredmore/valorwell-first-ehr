
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';

interface UseAssessmentSubmissionProps {
  type: 'phq9' | 'gad7';
  clientId: string;
  form: UseFormReturn<any>;
}

export const useAssessmentSubmission = ({ 
  type, 
  clientId, 
  form 
}: UseAssessmentSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formData = form.getValues();
      const table = type === 'phq9' ? 'phq9_assessments' : 'gad7_assessments';
      
      const { error: submissionError } = await supabase
        .from(table)
        .insert({
          client_id: clientId,
          ...formData,
          assessment_date: new Date().toISOString()
        });

      if (submissionError) throw submissionError;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error
  };
};
