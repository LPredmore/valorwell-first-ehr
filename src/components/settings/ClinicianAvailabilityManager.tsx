
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TimeField } from '@/components/ui/time-field';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TIMEZONE_OPTIONS } from '@/utils/timezoneOptions';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Trash2 } from 'lucide-react';

interface ClinicianAvailabilityManagerProps {
  clinicianId: string;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface AvailabilitySlot {
  start: string;
  end: string;
  timezone: string;
}

const defaultSlots: Record<string, AvailabilitySlot[]> = {
  monday: [{ start: '', end: '', timezone: 'America/Chicago' }],
  tuesday: [{ start: '', end: '', timezone: 'America/Chicago' }],
  wednesday: [{ start: '', end: '', timezone: 'America/Chicago' }],
  thursday: [{ start: '', end: '', timezone: 'America/Chicago' }],
  friday: [{ start: '', end: '', timezone: 'America/Chicago' }],
  saturday: [{ start: '', end: '', timezone: 'America/Chicago' }],
  sunday: [{ start: '', end: '', timezone: 'America/Chicago' }]
};

const ClinicianAvailabilityManager: React.FC<ClinicianAvailabilityManagerProps> = ({ clinicianId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday');
  const [availability, setAvailability] = useState<Record<DayOfWeek, AvailabilitySlot[]>>(defaultSlots);

  useEffect(() => {
    fetchClinicianAvailability();
  }, [clinicianId]);

  const fetchClinicianAvailability = async () => {
    if (!clinicianId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clinicians')
        .select(`
          clinician_availability_start_monday_1,
          clinician_availability_end_monday_1,
          clinician_availability_timezone_monday_1,
          clinician_availability_start_monday_2,
          clinician_availability_end_monday_2,
          clinician_availability_timezone_monday_2,
          clinician_availability_start_monday_3,
          clinician_availability_end_monday_3,
          clinician_availability_timezone_monday_3,
          
          clinician_availability_start_tuesday_1,
          clinician_availability_end_tuesday_1,
          clinician_availability_timezone_tuesday_1,
          clinician_availability_start_tuesday_2,
          clinician_availability_end_tuesday_2,
          clinician_availability_timezone_tuesday_2,
          clinician_availability_start_tuesday_3,
          clinician_availability_end_tuesday_3,
          clinician_availability_timezone_tuesday_3,
          
          clinician_availability_start_wednesday_1,
          clinician_availability_end_wednesday_1,
          clinician_availability_timezone_wednesday_1,
          clinician_availability_start_wednesday_2,
          clinician_availability_end_wednesday_2,
          clinician_availability_timezone_wednesday_2,
          clinician_availability_start_wednesday_3,
          clinician_availability_end_wednesday_3,
          clinician_availability_timezone_wednesday_3,
          
          clinician_availability_start_thursday_1,
          clinician_availability_end_thursday_1,
          clinician_availability_timezone_thursday_1,
          clinician_availability_start_thursday_2,
          clinician_availability_end_thursday_2,
          clinician_availability_timezone_thursday_2,
          clinician_availability_start_thursday_3,
          clinician_availability_end_thursday_3,
          clinician_availability_timezone_thursday_3,
          
          clinician_availability_start_friday_1,
          clinician_availability_end_friday_1,
          clinician_availability_timezone_friday_1,
          clinician_availability_start_friday_2,
          clinician_availability_end_friday_2,
          clinician_availability_timezone_friday_2,
          clinician_availability_start_friday_3,
          clinician_availability_end_friday_3,
          clinician_availability_timezone_friday_3,
          
          clinician_availability_start_saturday_1,
          clinician_availability_end_saturday_1,
          clinician_availability_timezone_saturday_1,
          clinician_availability_start_saturday_2,
          clinician_availability_end_saturday_2,
          clinician_availability_timezone_saturday_2,
          clinician_availability_start_saturday_3,
          clinician_availability_end_saturday_3,
          clinician_availability_timezone_saturday_3,
          
          clinician_availability_start_sunday_1,
          clinician_availability_end_sunday_1,
          clinician_availability_timezone_sunday_1,
          clinician_availability_start_sunday_2,
          clinician_availability_end_sunday_2,
          clinician_availability_timezone_sunday_2,
          clinician_availability_start_sunday_3,
          clinician_availability_end_sunday_3,
          clinician_availability_timezone_sunday_3
        `)
        .eq('id', clinicianId)
        .single();
      
      if (error) throw error;

      // Convert database data to our state format
      if (data) {
        const newAvailability: Record<DayOfWeek, AvailabilitySlot[]> = {
          monday: [], tuesday: [], wednesday: [], thursday: [], 
          friday: [], saturday: [], sunday: []
        };

        const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
          for (let i = 1; i <= 3; i++) {
            const start = data[`clinician_availability_start_${day}_${i}`];
            const end = data[`clinician_availability_end_${day}_${i}`];
            const timezone = data[`clinician_availability_timezone_${day}_${i}`] || 'America/Chicago';
            
            if (start && end) {
              newAvailability[day].push({
                start,
                end,
                timezone
              });
            }
          }
          
          // If no slots found, add empty default slot
          if (newAvailability[day].length === 0) {
            newAvailability[day].push({ start: '', end: '', timezone: 'America/Chicago' });
          }
        });

        setAvailability(newAvailability);
      }
    } catch (error) {
      console.error('Error fetching clinician availability:', error);
      toast({
        title: "Error",
        description: "Failed to fetch availability. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!clinicianId) return;

    try {
      setSaving(true);
      
      const updateData: Record<string, any> = {};
      
      // Convert our state format back to database format
      const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      days.forEach(day => {
        // Process up to 3 slots per day
        for (let i = 0; i < 3; i++) {
          const slotIndex = i + 1; // Database uses 1-based indexing for slots
          const slot = availability[day][i];
          
          if (slot) {
            updateData[`clinician_availability_start_${day}_${slotIndex}`] = slot.start || null;
            updateData[`clinician_availability_end_${day}_${slotIndex}`] = slot.end || null;
            updateData[`clinician_availability_timezone_${day}_${slotIndex}`] = slot.timezone || 'America/Chicago';
          } else {
            // Clear any slots that no longer exist
            updateData[`clinician_availability_start_${day}_${slotIndex}`] = null;
            updateData[`clinician_availability_end_${day}_${slotIndex}`] = null;
            updateData[`clinician_availability_timezone_${day}_${slotIndex}`] = 'America/Chicago';
          }
        }
      });

      const { error } = await supabase
        .from('clinicians')
        .update(updateData)
        .eq('id', clinicianId);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability settings saved successfully.",
      });
    } catch (error) {
      console.error('Error saving clinician availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (day: DayOfWeek, index: number, field: keyof AvailabilitySlot, value: string) => {
    setAvailability(prev => {
      const newAvailability = { ...prev };
      
      // Create the slot if it doesn't exist
      if (!newAvailability[day][index]) {
        newAvailability[day][index] = { start: '', end: '', timezone: 'America/Chicago' };
      }
      
      // Update the specified field
      newAvailability[day][index] = {
        ...newAvailability[day][index],
        [field]: value
      };
      
      return newAvailability;
    });
  };

  const addSlot = (day: DayOfWeek) => {
    if (availability[day].length >= 3) {
      toast({
        title: "Limit Reached",
        description: "Maximum 3 availability slots per day.",
        variant: "default"
      });
      return;
    }

    setAvailability(prev => {
      const newAvailability = { ...prev };
      newAvailability[day] = [
        ...newAvailability[day],
        { start: '', end: '', timezone: 'America/Chicago' }
      ];
      return newAvailability;
    });
  };

  const removeSlot = (day: DayOfWeek, index: number) => {
    setAvailability(prev => {
      const newAvailability = { ...prev };
      
      // Remove the slot at the specified index
      newAvailability[day] = newAvailability[day].filter((_, i) => i !== index);
      
      // If all slots were removed, add an empty slot
      if (newAvailability[day].length === 0) {
        newAvailability[day] = [{ start: '', end: '', timezone: 'America/Chicago' }];
      }
      
      return newAvailability;
    });
  };

  const renderDayAvailability = (day: DayOfWeek) => {
    return (
      <div className="space-y-6">
        {availability[day].map((slot, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-md border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-sm">Slot {index + 1}</h3>
              {availability[day].length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeSlot(day, index)}
                  className="h-6 p-1"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`start-${day}-${index}`} className="mb-2 block">
                  Start Time
                </Label>
                <TimeField
                  value={slot.start}
                  onChange={(value) => updateSlot(day, index, 'start', value)}
                  placeholder="Select start time"
                />
              </div>
              <div>
                <Label htmlFor={`end-${day}-${index}`} className="mb-2 block">
                  End Time
                </Label>
                <TimeField
                  value={slot.end}
                  onChange={(value) => updateSlot(day, index, 'end', value)}
                  placeholder="Select end time"
                />
              </div>
              <div>
                <Label htmlFor={`timezone-${day}-${index}`} className="mb-2 block">
                  Time Zone
                </Label>
                <Select 
                  value={slot.timezone} 
                  onValueChange={(value) => updateSlot(day, index, 'timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        {availability[day].length < 3 && (
          <Button 
            variant="outline" 
            onClick={() => addSlot(day)}
            className="w-full"
          >
            Add Another Time Slot
          </Button>
        )}
      </div>
    );
  };

  const capitalizeDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading availability settings...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Set Your Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monday" value={activeDay} onValueChange={(value) => setActiveDay(value as DayOfWeek)}>
          <TabsList className="grid grid-cols-7 mb-4">
            {Object.keys(availability).map((day) => (
              <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">
                {capitalizeDay(day).slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(availability).map((day) => (
            <TabsContent key={day} value={day}>
              <h3 className="text-lg font-medium mb-4">{capitalizeDay(day)} Availability</h3>
              {renderDayAvailability(day as DayOfWeek)}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 text-right">
          <Button onClick={handleSaveAvailability} disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicianAvailabilityManager;
