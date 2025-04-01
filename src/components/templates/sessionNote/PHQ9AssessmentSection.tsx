
import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface PHQ9AssessmentSectionProps {
  phq9Data: any;
}

export const PHQ9AssessmentSection: React.FC<PHQ9AssessmentSectionProps> = ({ 
  phq9Data 
}) => {
  if (!phq9Data) {
    return null; // Don't render anything if no PHQ-9 data is available
  }

  return (
    <div className="mb-6 mt-6">
      <h4 className="text-md font-medium text-gray-800 mb-4">PHQ-9 Assessment</h4>
      
      {phq9Data.phq9_narrative && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Narrative</label>
          <Textarea
            className="min-h-[100px] bg-gray-100"
            value={phq9Data.phq9_narrative || ''}
            readOnly
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
          <div className="p-2 bg-gray-100 rounded border border-gray-200">
            {phq9Data.assessment_date || 'Not available'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Score</label>
          <div className="p-2 bg-gray-100 rounded border border-gray-200">
            {phq9Data.total_score !== undefined ? phq9Data.total_score : 'Not available'}
          </div>
        </div>
      </div>
    </div>
  );
};
