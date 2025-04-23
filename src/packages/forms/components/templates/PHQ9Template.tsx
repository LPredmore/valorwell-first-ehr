
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PHQ9TemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clientData?: any;
  appointmentId?: string | number | null;
  onComplete?: () => void;
}

const PHQ9Template: React.FC<PHQ9TemplateProps> = ({
  onClose,
  clinicianName = "Your Therapist",
  clientData,
  appointmentId,
  onComplete
}) => {
  const handleSubmit = () => {
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white p-6 rounded-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">PHQ-9 Assessment</h2>
        <p className="mb-6">
          This questionnaire is an important part of providing you with the best health care possible. 
          Your answers will help in understanding problems that you may have.
        </p>

        {/* Placeholder for actual assessment questions */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-medium">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
            <p className="text-sm text-gray-500 mt-2">
              Please respond to all questions to continue.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Assessment
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PHQ9Template;
