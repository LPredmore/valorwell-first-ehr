
import React from 'react';

interface PHQ9AssessmentSectionProps {
  formState: {
    phq9Assessment: {
      totalScore: number | null;
      assessmentDate: string | null;
      question1: number | null;
      question2: number | null;
      question3: number | null;
      question4: number | null;
      question5: number | null;
      question6: number | null;
      question7: number | null;
      question8: number | null;
      question9: number | null;
      additionalNotes: string | null;
    } | null;
  };
}

export const PHQ9AssessmentSection: React.FC<PHQ9AssessmentSectionProps> = ({ formState }) => {
  const phq9 = formState.phq9Assessment;
  
  if (!phq9 || phq9.totalScore === null) {
    return (
      <div className="mb-6 mt-6">
        <h4 className="text-md font-medium text-gray-800 mb-4">PHQ-9 Assessment</h4>
        <p className="text-gray-500 italic">No PHQ-9 assessment found for this session date.</p>
      </div>
    );
  }

  // Determine depression severity based on total score
  const getSeverity = (score: number): string => {
    if (score >= 0 && score <= 4) return "None-minimal";
    if (score >= 5 && score <= 9) return "Mild";
    if (score >= 10 && score <= 14) return "Moderate";
    if (score >= 15 && score <= 19) return "Moderately severe";
    if (score >= 20) return "Severe";
    return "Unknown";
  };

  const severity = getSeverity(phq9.totalScore);

  return (
    <div className="mb-6 mt-6">
      <h4 className="text-md font-medium text-gray-800 mb-4">PHQ-9 Assessment</h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Assessment Date:</p>
          <p className="text-sm text-gray-600">{phq9.assessmentDate || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Total Score:</p>
          <p className="text-sm text-gray-600">{phq9.totalScore} - {severity} depression</p>
        </div>
      </div>

      <div className="border rounded-md p-4 bg-gray-50">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Individual Responses:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-600">1. Little interest or pleasure: {phq9.question1}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">2. Feeling down or depressed: {phq9.question2}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">3. Trouble sleeping: {phq9.question3}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">4. Feeling tired: {phq9.question4}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">5. Poor appetite/overeating: {phq9.question5}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">6. Feeling bad about yourself: {phq9.question6}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">7. Trouble concentrating: {phq9.question7}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">8. Moving slowly/being fidgety: {phq9.question8}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">9. Thoughts of self-harm: {phq9.question9}</p>
          </div>
        </div>
        
        {phq9.additionalNotes && (
          <div className="mt-3">
            <h5 className="text-sm font-medium text-gray-700">Additional Notes:</h5>
            <p className="text-xs text-gray-600">{phq9.additionalNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
