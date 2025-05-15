
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface PHQ9AssessmentSectionProps {
  phq9Data: any;
}

export const PHQ9AssessmentSection: React.FC<PHQ9AssessmentSectionProps> = ({
  phq9Data
}) => {
  if (!phq9Data) {
    return null; // Don't render anything if no PHQ-9 data is available
  }
  
  // Function to determine severity based on total score
  const getSeverity = (score: number) => {
    if (score >= 0 && score <= 4) return "None-minimal";
    if (score >= 5 && score <= 9) return "Mild";
    if (score >= 10 && score <= 14) return "Moderate";
    if (score >= 15 && score <= 19) return "Moderately severe";
    return "Severe";
  };

  return (
    <div className="mb-6 mt-6">
      <h4 className="text-md font-medium text-gray-800 mb-4">PHQ-9 Assessment</h4>
      
      <Card className="bg-gray-50 mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium">Total Score: <span className="font-normal">{phq9Data.total_score}</span></p>
              <p className="text-sm font-medium">Severity: <span className="font-normal">{getSeverity(phq9Data.total_score)}</span></p>
              <p className="text-sm font-medium">Assessment Date: <span className="font-normal">{phq9Data.assessment_date}</span></p>
            </div>
            <div>
              <p className="text-sm font-medium">PHQ-9 Score Ranges:</p>
              <ul className="text-xs text-gray-600">
                <li>0-4: None-minimal</li>
                <li>5-9: Mild</li>
                <li>10-14: Moderate</li>
                <li>15-19: Moderately severe</li>
                <li>20-27: Severe</li>
              </ul>
            </div>
          </div>

          {phq9Data.phq9_narrative && (
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Assessment Summary</h5>
              <Textarea 
                className="min-h-[100px] bg-white resize-y" 
                value={phq9Data.phq9_narrative || ''} 
                readOnly 
              />
            </div>
          )}
          
          {phq9Data.additional_notes && (
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Additional Notes</h5>
              <Textarea 
                className="min-h-[80px] bg-white resize-y" 
                value={phq9Data.additional_notes || ''} 
                readOnly 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
