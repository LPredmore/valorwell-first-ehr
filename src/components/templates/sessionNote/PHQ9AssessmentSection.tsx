
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
          <Textarea 
            className="min-h-[100px] bg-gray-100 resize-y" 
            value={phq9Data.phq9_narrative || ''} 
            readOnly 
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          {/* PHQ-9 left column details if needed */}
        </div>
        <div>
          {/* PHQ-9 right column details if needed */}
        </div>
      </div>
      
      <h4 className="text-md font-medium text-gray-800 mb-4 mt-6">Plan & Signature</h4>
    </div>
  );
};
