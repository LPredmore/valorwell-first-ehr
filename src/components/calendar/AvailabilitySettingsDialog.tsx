
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvailabilityService } from '@/services/availabilityService';
import { AvailabilitySettings } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';

interface AvailabilitySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
  onSettingsSaved?: () => void;
}

export default function AvailabilitySettingsDialog({
  isOpen,
  onClose,
  clinicianId,
  onSettingsSaved
}: AvailabilitySettingsDialogProps) {
  const { toast } = useToast();
  const { timeZone } = useUserTimeZone(clinicianId);
  const [settings, setSettings] = useState<Partial<AvailabilitySettings>>({
    defaultSlotDuration: 60,
    minNoticeDays: 1,
    maxAdvanceDays: 30
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!clinicianId) return;
      
      setIsLoading(true);
      try {
        const currentSettings = await AvailabilityService.getSettings(clinicianId);
        if (currentSettings) {
          setSettings(currentSettings);
        }
      } catch (error) {
        console.error('Error fetching availability settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load availability settings',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && clinicianId) {
      fetchSettings();
    }
  }, [clinicianId, isOpen, toast]);

  const handleSave = async () => {
    if (!clinicianId) {
      toast({
        title: 'Error',
        description: 'No clinician selected',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings = await AvailabilityService.updateSettings(
        clinicianId,
        settings
      );

      if (updatedSettings) {
        toast({
          title: 'Success',
          description: 'Availability settings saved successfully'
        });
        
        if (onSettingsSaved) {
          onSettingsSaved();
        }
        
        onClose();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving availability settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save availability settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultSlotDuration" className="text-right">
                Default Duration (min)
              </Label>
              <div className="col-span-3">
                <Select 
                  value={String(settings.defaultSlotDuration)}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, defaultSlotDuration: parseInt(value) }))}
                >
                  <SelectTrigger id="defaultSlotDuration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minNoticeDays" className="text-right">
                Minimum Notice (days)
              </Label>
              <Input
                id="minNoticeDays"
                type="number"
                min="0"
                max="30"
                className="col-span-3"
                value={settings.minNoticeDays}
                onChange={(e) => setSettings(prev => ({ ...prev, minNoticeDays: parseInt(e.target.value) }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxAdvanceDays" className="text-right">
                Maximum Advance (days)
              </Label>
              <Input
                id="maxAdvanceDays"
                type="number"
                min="1"
                max="365"
                className="col-span-3"
                value={settings.maxAdvanceDays}
                onChange={(e) => setSettings(prev => ({ ...prev, maxAdvanceDays: parseInt(e.target.value) }))}
              />
            </div>

            {timeZone && (
              <div className="text-sm text-muted-foreground mt-2">
                All times are in {timeZone}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
