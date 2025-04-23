import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PHQ9TemplateProps {
  onClose: () => void;
  clinicianName: string;
  clientData: any;
  appointmentId: string | number | null;
  onComplete: () => void;
}

const PHQ9Template: React.FC<PHQ9TemplateProps> = ({
  onClose,
  clinicianName,
  clientData,
  appointmentId,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState({
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0,
    q6: 0, q7: 0, q8: 0, q9: 0
  });

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmit = async () => {
    if (!clientData?.id || !appointmentId) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save PHQ9 assessment to database
      const totalScore = calculateTotal();
      
      const { error } = await supabase
        .from('phq9_assessments')
        .insert({
          client_id: clientData.id,
          appointment_id: appointmentId,
          question_1: scores.q1,
          question_2: scores.q2,
          question_3: scores.q3,
          question_4: scores.q4,
          question_5: scores.q5,
          question_6: scores.q6,
          question_7: scores.q7,
          question_8: scores.q8,
          question_9: scores.q9,
          total_score: totalScore,
          assessment_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        throw error;
      }

      toast.success('PHQ-9 assessment completed');
      onComplete();
    } catch (error) {
      console.error('Error saving PHQ-9 assessment:', error);
      toast.error('Could not save your assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">PHQ-9 Assessment</h2>
        <p className="mb-6">
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </p>

        <div className="space-y-6 mb-6">
          {/* Simple placeholder content */}
          <p>This is a simplified PHQ-9 template for demonstration purposes.</p>
          <p>In a real implementation, this would include all 9 questions with radio buttons for scoring.</p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PHQ9Template;
