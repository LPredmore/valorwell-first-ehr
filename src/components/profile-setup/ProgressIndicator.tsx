import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  currentStep, 
  totalSteps 
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-valorwell-700">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm text-valorwell-700">{percentage}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-valorwell-600 h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
