
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailabilitySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
  onSettingsUpdated: () => void;
}

interface AvailabilitySettings {
  id: string;
  time_granularity: 'hour' | 'half_hour' | 'quarter_hour' | 'custom';
  custom_minutes?: number;
  min_days_ahead: number;
  max_days_ahead: number;
  buffer_minutes: number;
  show_availability_to_clients: boolean;
}

const AvailabilitySettingsDialog: React.FC<AvailabilitySettingsDialogProps> = ({
  isOpen,
  onClose,
  clinicianId,
  onSettingsUpdated
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [activeTab, setActiveTab] = useState('time-slots');

  // Fetch availability settings
  useEffect(() => {
    if (isOpen && clinicianId) {
      fetchSettings();
    }
  }, [isOpen, clinicianId]);

  const fetchSettings = async () => {
    if (!clinicianId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .single();
        
      if (error) {
        console.error('Error fetching availability settings:', error);
        throw error;
      }
      
      setSettings(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load availability settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!clinicianId || !settings) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('availability_settings')
        .update({
          time_granularity: settings.time_granularity,
          custom_minutes: settings.custom_minutes,
          min_days_ahead: settings.min_days_ahead,
          max_days_ahead: settings.max_days_ahead,
          buffer_minutes: settings.buffer_minutes,
          show_availability_to_clients: settings.show_availability_to_clients
        })
        .eq('id', settings.id);
        
      if (error) {
        console.error('Error updating availability settings:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Availability settings updated successfully'
      });
      
      onSettingsUpdated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof AvailabilitySettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: value
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl mx-auto">
        <DialogHeader>
          <DialogTitle>Availability Settings</DialogTitle>
          <DialogDescription>
            Configure how clients can book appointments with you
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="time-slots">Time Slots</TabsTrigger>
            <TabsTrigger value="scheduling-rules">Scheduling Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="time-slots" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="time-granularity" className="mb-1 block">Time Slot Intervals</Label>
                <Select 
                  value={settings.time_granularity} 
                  onValueChange={(value) => handleInputChange('time_granularity', value)}
                >
                  <SelectTrigger id="time-granularity">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour (e.g., 9:00, 10:00)</SelectItem>
                    <SelectItem value="half_hour">Half Hour (e.g., 9:00, 9:30)</SelectItem>
                    <SelectItem value="quarter_hour">Quarter Hour (e.g., 9:00, 9:15, 9:30, 9:45)</SelectItem>
                    <SelectItem value="custom">Custom Interval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.time_granularity === 'custom' && (
                <div>
                  <Label htmlFor="custom-minutes" className="mb-1 block">Custom Interval (minutes)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="custom-minutes"
                      min={5} 
                      max={120} 
                      step={5} 
                      value={[settings.custom_minutes || 15]} 
                      onValueChange={(value) => handleInputChange('custom_minutes', value[0])} 
                    />
                    <span className="w-12 text-center">{settings.custom_minutes || 15}m</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="buffer-minutes" className="mb-1 block">Buffer Time Between Appointments</Label>
                <div className="flex items-center space-x-2">
                  <Slider 
                    id="buffer-minutes"
                    min={0} 
                    max={60} 
                    step={5} 
                    value={[settings.buffer_minutes]} 
                    onValueChange={(value) => handleInputChange('buffer_minutes', value[0])} 
                  />
                  <span className="w-12 text-center">{settings.buffer_minutes}m</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduling-rules" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="min-days-ahead" className="mb-1 block">Minimum Advance Notice</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="min-days-ahead"
                    type="number" 
                    min={0} 
                    max={30} 
                    value={settings.min_days_ahead} 
                    onChange={(e) => handleInputChange('min_days_ahead', parseInt(e.target.value))} 
                    className="w-20"
                  />
                  <span>days in advance</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Clients must book at least this many days before the appointment
                </p>
              </div>

              <div>
                <Label htmlFor="max-days-ahead" className="mb-1 block">Maximum Booking Window</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="max-days-ahead"
                    type="number" 
                    min={1} 
                    max={365} 
                    value={settings.max_days_ahead} 
                    onChange={(e) => handleInputChange('max_days_ahead', parseInt(e.target.value))} 
                    className="w-20"
                  />
                  <span>days in the future</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Clients can only book up to this many days in the future
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-availability" className="mb-1 block">Show Availability to Clients</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, clients can see your available slots
                  </p>
                </div>
                <Switch 
                  id="show-availability"
                  checked={settings.show_availability_to_clients} 
                  onCheckedChange={(checked) => handleInputChange('show_availability_to_clients', checked)} 
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilitySettingsDialog;
