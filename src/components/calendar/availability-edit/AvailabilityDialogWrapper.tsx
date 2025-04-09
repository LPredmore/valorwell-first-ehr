
import React, { useState } from 'react';
import AvailabilityEditDialog from '../AvailabilityEditDialog';
import { useToast } from '@/hooks/use-toast';

/**
 * A wrapper component that safely handles the opening of the AvailabilityEditDialog
 * by ensuring all required props are available before rendering the dialog.
 */
interface AvailabilityDialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock?: any;
  specificDate?: Date;
  clinicianId?: string | null;
  onAvailabilityUpdated?: () => void;
}

const AvailabilityDialogWrapper: React.FC<AvailabilityDialogWrapperProps> = ({
  isOpen,
  onClose,
  availabilityBlock,
  specificDate,
  clinicianId,
  onAvailabilityUpdated
}) => {
  const { toast } = useToast();
  const [hasShownError, setHasShownError] = useState(false);

  // Check if we have the required data to show the dialog
  const hasRequiredData = isOpen && availabilityBlock && specificDate;

  // If dialog is open but missing required data, show an error and close it
  React.useEffect(() => {
    if (isOpen && !hasRequiredData && !hasShownError) {
      console.error("Cannot open availability dialog due to missing required data:", {
        hasAvailabilityBlock: !!availabilityBlock,
        hasSpecificDate: !!specificDate
      });
      
      toast({
        title: "Unable to edit availability",
        description: "Some required information is missing. Please try again.",
        variant: "destructive"
      });
      
      setHasShownError(true);
      onClose();
    } else if (!isOpen) {
      // Reset the error flag when dialog is closed
      setHasShownError(false);
    }
  }, [isOpen, hasRequiredData, onClose, hasShownError, availabilityBlock, specificDate, toast]);

  // Only render the dialog if we have all required data
  if (!hasRequiredData) {
    return null;
  }

  return (
    <AvailabilityEditDialog
      isOpen={isOpen}
      onClose={onClose}
      availabilityBlock={availabilityBlock}
      specificDate={specificDate}
      clinicianId={clinicianId}
      onAvailabilityUpdated={onAvailabilityUpdated}
    />
  );
};

export default AvailabilityDialogWrapper;
