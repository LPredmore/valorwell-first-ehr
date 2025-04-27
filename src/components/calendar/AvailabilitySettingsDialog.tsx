
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Add permissionLevel to the props
interface AvailabilitySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string;
  onSettingsSaved?: () => void;
  permissionLevel?: 'full' | 'limited' | 'none';
  error?: string | null;
}

const AvailabilitySettingsDialog: React.FC<AvailabilitySettingsDialogProps> = ({
  isOpen,
  onClose,
  clinicianId,
  onSettingsSaved,
  permissionLevel = 'full',
  error
}) => {
  const [defaultSlotDuration, setDefaultSlotDuration] = useState(60);
  const [minNoticeDays, setMinNoticeDays] = useState(1);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    defaultSlotDuration: 60,
    minNoticeDays: 1,
    maxAdvanceDays: 30,
    timeZone: 'America/Chicago'
  });
  
  const {
    settings: loadedSettings,
    isLoading,
    updateSettings
  } = useAvailability(clinicianId);

  // Initialize form with existing settings
  useEffect(() => {
    if (loadedSettings) {
      console.log('[AvailabilitySettingsDialog] Loading settings:', loadedSettings);
      setSettings({
        defaultSlotDuration: loadedSettings.defaultSlotDuration,
        minNoticeDays: loadedSettings.minNoticeDays,
        maxAdvanceDays: loadedSettings.maxAdvanceDays,
        timeZone: loadedSettings.timeZone
      });
      setDefaultSlotDuration(loadedSettings.defaultSlotDuration);
      setMinNoticeDays(loadedSettings.minNoticeDays);
      setMaxAdvanceDays(loadedSettings.maxAdvanceDays);
    }
  }, [loadedSettings]);

  // Add permission check to handleSave
  const handleSave = async () => {
    if (permissionLevel === 'none') {
      return;
    }
    
    if (!clinicianId) return;
    
    setIsSubmitting(true);
    try {
      console.log('[AvailabilitySettingsDialog] Saving settings:', {
        defaultSlotDuration,
        minNoticeDays,
        maxAdvanceDays,
        clinicianId
      });
      
      const result = await updateSettings({
        defaultSlotDuration,
        minNoticeDays,
        maxAdvanceDays,
        timeZone: settings.timeZone
      });
      
      if (result) {
        onSettingsSaved?.();
        onClose();
      }
    } catch (error) {
      console.error('[AvailabilitySettingsDialog] Error saving availability settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ... keep existing code (useEffect, other functions)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Availability Settings</DialogTitle>
          <DialogDescription>
            Configure your availability preferences
          </DialogDescription>
        </DialogHeader>
        
        {permissionLevel !== 'full' && (
          <Alert variant="warning" className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You may have limited permissions to manage these settings.
              {permissionLevel === 'none' ? " You can only view the settings." : " Some actions may be restricted."}
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="timeZone" className="text-right">
                  Time Zone
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={settings.timeZone} 
                    onValueChange={(value) => 
                      setSettings({...settings, timeZone: value})
                    }
                    disabled={permissionLevel === 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TimeZoneService.TIMEZONE_OPTIONS.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="defaultSlotDuration" className="text-right">
                  Default Appointment Duration (minutes)
                </Label>
                <div className="col-span-3">
                  <Input
                    id="defaultSlotDuration"
                    type="number"
                    min={15}
                    step={15}
                    value={settings.defaultSlotDuration}
                    onChange={(e) => setSettings({...settings, defaultSlotDuration: Number(e.target.value)})}
                    disabled={permissionLevel === 'none'}
                  />
                  <p className="text-xs text-gray-500">
                    Default length of time for appointment slots (in minutes)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minNoticeDays" className="text-right">
                  Minimum Notice (days)
                </Label>
                <div className="col-span-3">
                  <Input
                    id="minNoticeDays"
                    type="number"
                    min={0}
                    value={settings.minNoticeDays}
                    onChange={(e) => setSettings({...settings, minNoticeDays: Number(e.target.value)})}
                    disabled={permissionLevel === 'none'}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum number of days in advance clients must schedule
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxAdvanceDays" className="text-right">
                  Maximum Advance (days)
                </Label>
                <div className="col-span-3">
                  <Input
                    id="maxAdvanceDays"
                    type="number"
                    min={1}
                    value={settings.maxAdvanceDays}
                    onChange={(e) => setSettings({...settings, maxAdvanceDays: Number(e.target.value)})}
                    disabled={permissionLevel === 'none'}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of days in advance clients can schedule
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || permissionLevel === 'none'}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Export as default
export default AvailabilitySettingsDialog;
