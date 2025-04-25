
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';

interface AvailabilitySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string;
  onSettingsSaved?: () => void;
}

/**
 * Dialog for managing availability settings
 */
const AvailabilitySettingsDialog: React.FC<AvailabilitySettingsDialogProps> = ({
  isOpen,
  onClose,
  clinicianId,
  onSettingsSaved
}) => {
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(60);
  const [minNoticeDays, setMinNoticeDays] = useState(1);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    settings,
    isLoading,
    updateSettings
  } = useAvailability(clinicianId);

  // Initialize form with existing settings
  useEffect(() => {
    if (settings) {
      setDefaultSlotDuration(settings.defaultSlotDuration);
      setMinNoticeDays(settings.minNoticeDays);
      setMaxAdvanceDays(settings.maxAdvanceDays);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!clinicianId) return;
    
    setIsSubmitting(true);
    try {
      const result = await updateSettings({
        defaultSlotDuration,
        minNoticeDays,
        maxAdvanceDays
      });
      
      if (result) {
        onSettingsSaved?.();
        onClose();
      }
    } catch (error) {
      console.error('Error saving availability settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Availability Settings</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultSlotDuration">Default Appointment Duration (minutes)</Label>
              <Input
                id="defaultSlotDuration"
                type="number"
                min={15}
                step={15}
                value={defaultSlotDuration}
                onChange={(e) => setDefaultSlotDuration(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Default length of time for appointment slots (in minutes)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minNoticeDays">Minimum Notice (days)</Label>
              <Input
                id="minNoticeDays"
                type="number"
                min={0}
                value={minNoticeDays}
                onChange={(e) => setMinNoticeDays(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Minimum number of days in advance clients must schedule
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxAdvanceDays">Maximum Advance (days)</Label>
              <Input
                id="maxAdvanceDays"
                type="number"
                min={1}
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Maximum number of days in advance clients can schedule
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilitySettingsDialog;
