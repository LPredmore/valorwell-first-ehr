
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, X, Copy, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

const AvailabilityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('set');
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize a schedule for each day of the week
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', isOpen: true, timeSlots: [] },
    { day: 'Tuesday', isOpen: true, timeSlots: [] },
    { day: 'Wednesday', isOpen: true, timeSlots: [] },
    { day: 'Thursday', isOpen: true, timeSlots: [] },
    { day: 'Friday', isOpen: true, timeSlots: [] },
    { day: 'Saturday', isOpen: false, timeSlots: [] },
    { day: 'Sunday', isOpen: false, timeSlots: [] },
  ]);
  
  // Fetch availability data from database
  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      
      try {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session?.user) {
          console.log('User not logged in');
          setLoading(false);
          return;
        }
        
        // Get clinician id from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', sessionData.session.user.id)
          .single();
          
        if (!profileData) {
          console.log('Profile not found');
          setLoading(false);
          return;
        }
        
        // Get clinician id
        const { data: clinicianData } = await supabase
          .from('clinicians')
          .select('id')
          .eq('clinician_email', profileData.email)
          .single();
          
        if (clinicianData) {
          // Fetch availability data
          const { data: availabilityData, error } = await supabase
            .from('availability')
            .select('*')
            .eq('clinician_id', clinicianData.id)
            .eq('is_active', true);
            
          if (error) {
            console.error('Error fetching availability:', error);
          } else if (availabilityData && availabilityData.length > 0) {
            // Convert DB data to our UI format
            const newSchedule = [...weekSchedule];
            
            availabilityData.forEach(slot => {
              const dayIndex = newSchedule.findIndex(day => day.day === slot.day_of_week);
              if (dayIndex !== -1) {
                // Convert time format if needed
                const startTime = slot.start_time.substring(0, 5); // Convert "09:00:00" to "09:00"
                const endTime = slot.end_time.substring(0, 5);
                
                newSchedule[dayIndex].timeSlots.push({
                  id: slot.id,
                  startTime: startTime,
                  endTime: endTime,
                });
                
                // Mark day as open if it has time slots
                newSchedule[dayIndex].isOpen = true;
              }
            });
            
            setWeekSchedule(newSchedule);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAvailability();
  }, []);
  
  // Toggle day collapsible
  const toggleDayOpen = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        isOpen: !updated[dayIndex].isOpen
      };
      return updated;
    });
  };
  
  // Add a new time slot to a specific day
  const addTimeSlot = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      const newId = `${day.day.toLowerCase().substring(0,3)}-${day.timeSlots.length + 1}`;
      
      updated[dayIndex] = {
        ...day,
        timeSlots: [
          ...day.timeSlots, 
          { 
            id: newId, 
            startTime: '09:00', 
            endTime: '17:00' 
          }
        ]
      };
      
      return updated;
    });
  };
  
  // Delete a time slot from a specific day
  const deleteTimeSlot = (dayIndex: number, slotId: string) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      
      updated[dayIndex] = {
        ...day,
        timeSlots: day.timeSlots.filter(slot => slot.id !== slotId)
      };
      
      return updated;
    });
  };
  
  // Update time slot time
  const updateTimeSlot = (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      
      updated[dayIndex] = {
        ...day,
        timeSlots: day.timeSlots.map(slot => 
          slot.id === slotId ? { ...slot, [field]: value } : slot
        )
      };
      
      return updated;
    });
  };
  
  // Toggle availability for a day
  const toggleDayAvailability = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        isOpen: !updated[dayIndex].isOpen
      };
      return updated;
    });
  };
  
  // Save availability to database
  const saveAvailability = async () => {
    setIsSaving(true);
    
    try {
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save availability",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      // Get clinician id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', sessionData.session.user.id)
        .single();
        
      if (!profileData) {
        toast({
          title: "Profile Error",
          description: "Could not find your profile",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      // Get clinician id
      const { data: clinicianData } = await supabase
        .from('clinicians')
        .select('id')
        .eq('clinician_email', profileData.email)
        .single();
        
      if (!clinicianData) {
        toast({
          title: "Clinician Error",
          description: "Could not find your clinician record",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      // First, deactivate existing entries
      await supabase
        .from('availability')
        .update({ is_active: false })
        .eq('clinician_id', clinicianData.id);
      
      // Prepare availability data for insertion
      const availabilityToInsert = weekSchedule.flatMap(day => {
        // Skip days that are not open
        if (!day.isOpen) return [];
        
        // Return all time slots for this day
        return day.timeSlots.map(slot => ({
          clinician_id: clinicianData.id,
          day_of_week: day.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_active: true
        }));
      });
      
      // Insert new availability data
      if (availabilityToInsert.length > 0) {
        const { error } = await supabase
          .from('availability')
          .insert(availabilityToInsert);
          
        if (error) {
          toast({
            title: "Error Saving Availability",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Availability Saved",
            description: "Your availability has been updated successfully",
          });
        }
      } else {
        toast({
          title: "No Availability Set",
          description: "No available time slots were found to save",
        });
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving your availability",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate share link URL
  const generateShareLink = () => {
    // Get the current user's professional name (or another identifier)
    // For now, we'll just use a placeholder
    const baseUrl = window.location.origin;
    return `${baseUrl}/book/clinician123`;
  };
  
  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Booking link has been copied to clipboard",
    });
  };
  
  // Generate new booking link
  const generateNewLink = () => {
    toast({
      title: "New Link Generated",
      description: "A new booking link has been created",
    });
  };
  
  // Generate time options for select
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const hourFormatted = hour.toString().padStart(2, '0');
    const minuteFormatted = minute.toString().padStart(2, '0');
    return `${hourFormatted}:${minuteFormatted}`;
  });
  
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading availability...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm">Enabled</span>
            <Switch 
              checked={availabilityEnabled} 
              onCheckedChange={setAvailabilityEnabled} 
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="set">Set Hours</TabsTrigger>
            <TabsTrigger value="share">Share Link</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'set' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {weekSchedule.map((day, index) => (
                <Collapsible 
                  key={day.day} 
                  open={day.isOpen}
                  onOpenChange={() => toggleDayOpen(index)}
                  className="border rounded-md overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {day.isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Badge variant="outline" className="font-medium">
                        {day.day}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTimeSlot(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="p-3 space-y-2">
                      {day.timeSlots.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No time slots added. Click the + button to add one.
                        </div>
                      ) : (
                        day.timeSlots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <Select
                                value={slot.startTime}
                                onValueChange={(value) => updateTimeSlot(index, slot.id, 'startTime', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Start time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={`start-${time}`} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={slot.endTime}
                                onValueChange={(value) => updateTimeSlot(index, slot.id, 'endTime', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="End time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={`end-${time}`} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimeSlot(index, slot.id)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
            
            <Button 
              className="w-full" 
              onClick={saveAvailability}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Availability'}
            </Button>
          </div>
        )}
        
        {activeTab === 'share' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Share this link with your clients so they can book appointments during your available hours.
            </div>
            
            <div className="flex gap-2 p-2 border rounded-md">
              <div className="text-sm flex-1 truncate">
                {generateShareLink()}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={copyLinkToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              className="w-full"
              onClick={generateNewLink}
            >
              Generate New Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityPanel;
