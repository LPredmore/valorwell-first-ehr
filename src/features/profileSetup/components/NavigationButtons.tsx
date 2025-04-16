
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  finalStep: number;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  finalStep,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false
}) => {
  return (
    <div className="flex justify-between mt-8">
      {currentStep > 1 && onBack && (
        <Button 
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      {currentStep < finalStep && onNext && (
        <Button 
          type="button"
          onClick={onNext}
          className="bg-valorwell-600 hover:bg-valorwell-700 text-white ml-auto flex items-center gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
      
      {currentStep === finalStep && onSubmit && (
        <Button 
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-valorwell-600 hover:bg-valorwell-700 text-white ml-auto flex items-center gap-2"
        >
          {isSubmitting ? 'Processing...' : 'Complete Profile'}
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default NavigationButtons;
