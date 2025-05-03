
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TimeZoneService, TIMEZONE_OPTIONS } from '@/utils/timezone';

interface AvailabilitySettings {
  defaultAppointmentDuration: number;
  timeSlotIncrement: number;
  startTime: string;
  endTime: string;
  timezone: string;
  daysAvailable: string[];
  id?: string;
}

interface AvailabilitySettingsDialogProps {
  settings?: Partial<AvailabilitySettings>;
  onSave: (settings: AvailabilitySettings) => void;
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string;
}

const defaultSettings: AvailabilitySettings = {
  defaultAppointmentDuration: 50,
  timeSlotIncrement: 15,
  startTime: '09:00',
  endTime: '17:00',
  timezone: TimeZoneService.getLocalTimeZone(),
  daysAvailable: ['1', '2', '3', '4', '5'] // Monday to Friday
};

const daysOfWeek = [
  { id: '0', label: 'Sunday' },
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' }
];

const AvailabilitySettingsDialog: React.FC<AvailabilitySettingsDialogProps> = ({
  settings: initialSettings,
  onSave,
  isOpen,
  onClose,
  clinicianId
}) => {
  const [settings, setSettings] = useState<AvailabilitySettings>({
    ...defaultSettings,
    ...initialSettings
  });
  
  useEffect(() => {
    if (initialSettings) {
      setSettings({
        ...defaultSettings,
        ...initialSettings
      });
    }
  }, [initialSettings, isOpen]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'defaultAppointmentDuration' || name === 'timeSlotIncrement' 
        ? parseInt(value) 
        : value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setSettings({
      ...settings,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (dayId: string, checked: boolean) => {
    const updatedDays = checked
      ? [...settings.daysAvailable, dayId].sort()
      : settings.daysAvailable.filter(d => d !== dayId);
      
    setSettings({
      ...settings,
      daysAvailable: updatedDays
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      clinicianId
    } as AvailabilitySettings);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Availability Settings</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultAppointmentDuration">Default Session Length (minutes)</Label>
              <Input
                id="defaultAppointmentDuration"
                name="defaultAppointmentDuration"
                type="number"
                min="5"
                max="240"
                step="5"
                value={settings.defaultAppointmentDuration}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeSlotIncrement">Time Slot Increment (minutes)</Label>
              <Input
                id="timeSlotIncrement"
                name="timeSlotIncrement"
                type="number"
                min="5"
                max="60"
                step="5"
                value={settings.timeSlotIncrement}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={settings.startTime}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={settings.endTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select 
              value={settings.timezone} 
              onValueChange={(value) => handleSelectChange('timezone', value)}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysOfWeek.map(day => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.id}`}
                    checked={settings.daysAvailable.includes(day.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(day.id, !!checked)}
                  />
                  <Label htmlFor={`day-${day.id}`} className="cursor-pointer">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilitySettingsDialog;
