
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timezone';
import { useAvailability } from '@/hooks/useAvailability';
import { AvailabilitySettings } from '@/types/availability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AvailabilitySettingsDialogProps {
  clinicianId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSettingsUpdated?: (settings: AvailabilitySettings) => void;
}

const AvailabilitySettingsDialog: React.FC<AvailabilitySettingsDialogProps> = ({
  clinicianId,
  isOpen = false,
  onClose = () => {},
  onSettingsUpdated = () => {}
}) => {
  const { toast } = useToast();
  const { settings, updateSettings } = useAvailability(clinicianId || null);
  
  const [slotDuration, setSlotDuration] = useState<number>(60);
  const [minNoticeDays, setMinNoticeDays] = useState<number>(1);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(30);
  const [timeZone, setTimeZone] = useState<string>(TimeZoneService.getUserTimeZone());
  const [timeGranularity, setTimeGranularity] = useState<'hour' | 'halfhour' | 'quarter'>('hour');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load existing settings when dialog opens
  useEffect(() => {
    if (settings && isOpen) {
      setSlotDuration(settings.slotDuration || 60);
      setMinNoticeDays(settings.minNoticeDays || 1);
      setMaxAdvanceDays(settings.maxAdvanceDays || 30);
      setTimeZone(settings.timeZone || TimeZoneService.getUserTimeZone());
      setTimeGranularity(settings.timeGranularity || 'hour');
    }
  }, [settings, isOpen]);

  const handleSaveSettings = async () => {
    if (!clinicianId) {
      toast({
        title: 'Error',
        description: 'Clinician ID is required',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const updatedSettings: Partial<AvailabilitySettings> = {
        slotDuration,
        minNoticeDays,
        maxAdvanceDays,
        timeZone,
        timeGranularity
      };
      
      const success = await updateSettings(updatedSettings);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Availability settings updated',
        });
        
        if (settings) {
          onSettingsUpdated({
            ...settings,
            ...updatedSettings
          } as AvailabilitySettings);
        }
        
        onClose();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update settings',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating availability settings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Availability Settings</DialogTitle>
          <DialogDescription>
            Configure your default settings for availability and scheduling.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Default Schedule Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slotDuration">Default Slot Duration (minutes)</Label>
              <Select 
                value={slotDuration.toString()} 
                onValueChange={(value) => setSlotDuration(parseInt(value))}
              >
                <SelectTrigger id="slotDuration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timeGranularity">Time Slot Granularity</Label>
              <Select 
                value={timeGranularity} 
                onValueChange={(value) => setTimeGranularity(value as 'hour' | 'halfhour' | 'quarter')}
              >
                <SelectTrigger id="timeGranularity">
                  <SelectValue placeholder="Select granularity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hourly (00:00)</SelectItem>
                  <SelectItem value="halfhour">Half-hour (00:30)</SelectItem>
                  <SelectItem value="quarter">Quarter-hour (00:15)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Controls how time slots are displayed and selected in the calendar
              </p>
            </div>
            
            <div>
              <Label htmlFor="minNoticeDays">Minimum Notice (days)</Label>
              <Input 
                id="minNoticeDays"
                type="number" 
                min="0"
                max="30"
                value={minNoticeDays} 
                onChange={(e) => setMinNoticeDays(parseInt(e.target.value) || 0)} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum number of days in advance clients must book
              </p>
            </div>
            
            <div>
              <Label htmlFor="maxAdvanceDays">Maximum Advance Booking (days)</Label>
              <Input 
                id="maxAdvanceDays"
                type="number" 
                min="1"
                max="365"
                value={maxAdvanceDays} 
                onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value) || 30)} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum days in the future clients can book appointments
              </p>
            </div>
            
            <div>
              <Label htmlFor="timeZone">Default Time Zone</Label>
              <Select 
                value={timeZone} 
                onValueChange={setTimeZone}
              >
                <SelectTrigger id="timeZone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TimeZoneService.TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Base timezone for your scheduling. All times will be stored in UTC.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilitySettingsDialog;
