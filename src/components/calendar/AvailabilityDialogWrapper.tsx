
import React, { useEffect, useState } from 'react';
import AvailabilityEditDialog from './AvailabilityEditDialog';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
}

interface AvailabilityDialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock: AvailabilityBlock | null;
  specificDate: Date | null;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
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
  const [hasRequiredData, setHasRequiredData] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      const hasAvailabilityBlock = !!availabilityBlock;
      const hasSpecificDate = !!specificDate;
      
      console.log('[AvailabilityDialogWrapper] Checking required data:', {
        hasAvailabilityBlock,
        hasSpecificDate,
        availabilityBlock,
        specificDate: specificDate?.toISOString()
      });
      
      if (!hasAvailabilityBlock || !hasSpecificDate) {
        // Missing required data, show error and auto-close
        toast({
          title: "Missing Data",
          description: "Required availability information is missing. Please try again.",
          variant: "destructive"
        });
        
        // Close the dialog automatically
        onClose();
        setHasRequiredData(false);
      } else {
        setHasRequiredData(true);
      }
    }
  }, [isOpen, availabilityBlock, specificDate, onClose, toast]);

  // Only render the dialog if we have required data
  if (!hasRequiredData) return null;
  
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
