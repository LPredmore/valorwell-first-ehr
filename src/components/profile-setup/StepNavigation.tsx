import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';

interface StepNavigationProps {
  showBackButton?: boolean;
  nextButtonText?: string;
  onNext?: () => Promise<void>;
  isNextDisabled?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  showBackButton = true,
  nextButtonText = "Next",
  onNext,
  isNextDisabled = false
}) => {
  const { handleGoBack, handleNext, isSubmitting } = useProfileSetup();
  
  const handleNextClick = async () => {
    if (onNext) {
      await onNext();
    } else {
      await handleNext();
    }
  };
  
  return (
    <div className="flex justify-between mt-8">
      {showBackButton && (
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      <div className="flex-1"></div>
      
      <Button 
        type="button" 
        onClick={handleNextClick}
        disabled={isNextDisabled || isSubmitting}
        className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && nextButtonText === "Complete Profile" ? "Completing..." : nextButtonText}
        {nextButtonText !== "Complete Profile" && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default StepNavigation;
