
import React from 'react';

interface ProfileProgressBarProps {
  currentStep: number;
  totalSteps: number;
  hasVaCoverage: boolean;
  hasMoreInsurance: boolean;
}

const ProfileProgressBar: React.FC<ProfileProgressBarProps> = ({ 
  currentStep, 
  totalSteps,
  hasVaCoverage,
  hasMoreInsurance
}) => {
  // Calculate steps to display based on coverage and insurance options
  const stepsToShow = [];
  
  for (let i = 1; i <= totalSteps; i++) {
    // Always include steps 1, 2, and the last step
    if (i === 1 || i === 2 || i === totalSteps) {
      stepsToShow.push(i);
      continue;
    }
    
    // Include step 3 for VA coverage options
    if (i === 3 && hasVaCoverage) {
      stepsToShow.push(i);
      continue;
    }
    
    // Include step 4 for insurance info if needed
    if (i === 4 && hasMoreInsurance) {
      stepsToShow.push(i);
      continue;
    }
    
    // Include step 5 for additional insurance if needed
    if (i === 5 && hasMoreInsurance && currentStep >= 5) {
      stepsToShow.push(i);
      continue;
    }
  }
  
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center">
        {stepsToShow.map((step, index) => (
          <React.Fragment key={step}>
            {index > 0 && (
              <div className={`w-12 h-1 ${currentStep >= step ? 'bg-valorwell-600' : 'bg-gray-200'}`} />
            )}
            <div className={`rounded-full h-10 w-10 flex items-center justify-center 
              ${currentStep >= step ? 'bg-valorwell-600 text-white' : 'bg-gray-200'}`}>
              {step}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProfileProgressBar;
