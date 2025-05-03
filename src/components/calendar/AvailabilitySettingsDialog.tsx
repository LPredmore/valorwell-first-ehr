
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailability } from '@/hooks/useAvailability';
import { useToast } from '@/components/ui/use-toast';
import { TimeZoneService } from '@/utils/timezone';
import { AvailabilitySettings } from '@/types/availability';

interface AvailabilitySettingsDialogProps {
  clinicianId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AvailabilitySettingsDialog: React.FC<AvailabilitySettingsDialogProps> = ({
  clinicianId,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<AvailabilitySettings>>({
    defaultSlotDuration: 60,
    slotDuration: 60,
    minNoticeDays: 1,
    maxAdvanceDays: 30,
    timeZone: 'America/Chicago',
    timeGranularity: 'hour'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings, updateSettings } = useAvailability(clinicianId || null);
  const { toast } = useToast();
  
  // Load existing settings
  useEffect(() => {
    if (isOpen && settings) {
      setFormData({
        defaultSlotDuration: settings.defaultSlotDuration,
        slotDuration: settings.slotDuration,
        minNoticeDays: settings.minNoticeDays,
        maxAdvanceDays: settings.maxAdvanceDays,
        timeZone: settings.timeZone,
        timeGranularity: settings.timeGranularity
      });
    }
  }, [isOpen, settings]);
  
  const handleChange = (field: keyof AvailabilitySettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async () => {
    if (!clinicianId) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await updateSettings(formData);
      
      if (success) {
        toast({
          title: 'Settings Updated',
          description: 'Your availability settings have been updated successfully.'
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update availability settings',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get common timezones for the dropdown
  const timezones = TimeZoneService.getCommonTimezones();
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Availability Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="defaultSlotDuration">Default Appointment Duration (minutes)</Label>
            <Input
              id="defaultSlotDuration"
              type="number"
              min={15}
              step={15}
              value={formData.defaultSlotDuration || 60}
              onChange={(e) => handleChange('defaultSlotDuration', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="slotDuration">Availability Slot Duration (minutes)</Label>
            <Input
              id="slotDuration"
              type="number"
              min={15}
              step={15}
              value={formData.slotDuration || 60}
              onChange={(e) => handleChange('slotDuration', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="minNoticeDays">Minimum Notice Period (days)</Label>
            <Input
              id="minNoticeDays"
              type="number"
              min={0}
              value={formData.minNoticeDays || 1}
              onChange={(e) => handleChange('minNoticeDays', parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500">Minimum days in advance clients need to book</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="maxAdvanceDays">Maximum Booking Window (days)</Label>
            <Input
              id="maxAdvanceDays"
              type="number"
              min={1}
              value={formData.maxAdvanceDays || 30}
              onChange={(e) => handleChange('maxAdvanceDays', parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500">How far in advance clients can book appointments</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="timeZone">Time Zone</Label>
            <Select 
              value={formData.timeZone} 
              onValueChange={(value) => handleChange('timeZone', value)}
            >
              <SelectTrigger id="timeZone" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="timeGranularity">Time Granularity</Label>
            <Select
              value={formData.timeGranularity}
              onValueChange={(value: any) => handleChange('timeGranularity', value)}
            >
              <SelectTrigger id="timeGranularity">
                <SelectValue placeholder="Select time granularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Hour</SelectItem>
                <SelectItem value="halfhour">Half Hour</SelectItem>
                <SelectItem value="quarter">Quarter Hour</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Defines the time intervals in your calendar</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilitySettingsDialog;
