
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Settings, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import AvailabilitySettingsDialog from './AvailabilitySettingsDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface TimeOffBlock {
  id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  note?: string;
}

interface AvailabilityPanelProps {
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
  userTimeZone?: string;
}

const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({
  clinicianId,
  onAvailabilityUpdated,
  userTimeZone
}) => {
  const { toast } = useToast();
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeOffBlocks, setTimeOffBlocks] = useState<TimeOffBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');
  
  // New state for adding availability
  const [newDayOfWeek, setNewDayOfWeek] = useState('Monday');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  
  // New state for adding time off
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newTimeOffNote, setNewTimeOffNote] = useState('');
  
  useEffect(() => {
    if (clinicianId) {
      fetchAvailabilityBlocks();
      fetchTimeOffBlocks();
    }
  }, [clinicianId]);
  
  const fetchAvailabilityBlocks = async () => {
    if (!clinicianId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
        
      if (error) {
        console.error('Error fetching availability:', error);
        throw error;
      }
      
      setAvailabilityBlocks(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load availability blocks',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeOffBlocks = async () => {
    if (!clinicianId) return;
    
    try {
      // This is a placeholder - you would need to create this table in Supabase
      const { data, error } = await supabase
        .from('time_off_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true)
        .order('start_date', { ascending: true });
        
      if (error) {
        // If the table doesn't exist yet, we'll just show an empty list
        if (error.code === '42P01') { // relation does not exist
          setTimeOffBlocks([]);
          return;
        }
        console.error('Error fetching time off blocks:', error);
        throw error;
      }
      
      setTimeOffBlocks(data || []);
    } catch (error) {
      console.error('Error:', error);
      // We don't show an error toast here as the table might not exist yet
      setTimeOffBlocks([]);
    }
  };

  const handleDeleteAvailability = async (blockId: string) => {
    if (!clinicianId) return;
    
    try {
      const { error } = await supabase
        .from('availability')
        .update({ is_active: false })
        .eq('id', blockId);
        
      if (error) {
        console.error('Error deleting availability:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Availability block removed'
      });
      
      fetchAvailabilityBlocks();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove availability block',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTimeOff = async (blockId: string) => {
    if (!clinicianId) return;
    
    try {
      const { error } = await supabase
        .from('time_off_blocks')
        .update({ is_active: false })
        .eq('id', blockId);
        
      if (error) {
        console.error('Error deleting time off block:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Time off block removed'
      });
      
      fetchTimeOffBlocks();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove time off block',
        variant: 'destructive'
      });
    }
  };

  const handleAddAvailability = async () => {
    if (!clinicianId) return;
    
    // Validate time inputs
    if (newStartTime >= newEndTime) {
      toast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('availability')
        .insert({
          clinician_id: clinicianId,
          day_of_week: newDayOfWeek,
          start_time: `${newStartTime}:00`,
          end_time: `${newEndTime}:00`,
          is_active: true
        })
        .select();
        
      if (error) {
        console.error('Error adding availability:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Availability block added'
      });
      
      setIsAddBlockDialogOpen(false);
      fetchAvailabilityBlocks();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add availability block',
        variant: 'destructive'
      });
    }
  };

  const handleAddTimeOff = async () => {
    if (!clinicianId) return;
    
    // Validate date inputs
    if (!newStartDate || !newEndDate || newStartDate > newEndDate) {
      toast({
        title: 'Invalid Date Range',
        description: 'End date must be on or after start date',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Check if the time_off_blocks table exists
      const { error: checkError } = await supabase
        .from('time_off_blocks')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist, we'll inform the user
      if (checkError && checkError.code === '42P01') {
        toast({
          title: 'Setup Required',
          description: 'Time off functionality requires additional setup. Please contact support.',
          variant: 'destructive'
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('time_off_blocks')
        .insert({
          clinician_id: clinicianId,
          start_date: newStartDate,
          end_date: newEndDate,
          note: newTimeOffNote,
          is_active: true
        })
        .select();
        
      if (error) {
        console.error('Error adding time off:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Time off block added'
      });
      
      setIsAddBlockDialogOpen(false);
      fetchTimeOffBlocks();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add time off block',
        variant: 'destructive'
      });
    }
  };

  const handleSettingsUpdated = () => {
    onAvailabilityUpdated();
  };
  
  // Function to format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return format(new Date(0, 0, 0, parseInt(hours), parseInt(minutes)), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleAddBlock = () => {
    // Reset form fields
    setNewDayOfWeek('Monday');
    setNewStartTime('09:00');
    setNewEndTime('17:00');
    setNewStartDate(format(new Date(), 'yyyy-MM-dd'));
    setNewEndDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    setNewTimeOffNote('');
    
    // Open dialog
    setIsAddBlockDialogOpen(true);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Availability</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSettingsDialogOpen(true)}
            className="h-9 px-2"
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading availability...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
                <TabsTrigger value="timeoff">Time Off</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="space-y-4">
                {availabilityBlocks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No weekly availability blocks set up</p>
                    <Button onClick={handleAddBlock}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Weekly Availability
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Group by day of week */}
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const dayBlocks = availabilityBlocks.filter(block => block.day_of_week === day);
                      if (dayBlocks.length === 0) return null;
                      
                      return (
                        <div key={day} className="space-y-2">
                          <h3 className="font-medium">{day}</h3>
                          <ul className="space-y-2">
                            {dayBlocks.map(block => (
                              <li key={block.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                  <span>
                                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                                  </span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteAvailability(block.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    
                    <Button 
                      className="w-full mt-4" 
                      variant="outline" 
                      onClick={handleAddBlock}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Weekly Availability
                    </Button>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="timeoff" className="space-y-4">
                {timeOffBlocks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No time off blocks set up</p>
                    <Button onClick={handleAddBlock}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Off
                    </Button>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {timeOffBlocks.map(block => (
                        <li key={block.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex flex-col">
                            <div className="flex items-center mb-1">
                              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="font-medium">
                                {formatDate(block.start_date)} - {formatDate(block.end_date)}
                              </span>
                            </div>
                            {block.note && (
                              <div className="text-sm text-gray-500 ml-6">
                                {block.note}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTimeOff(block.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full mt-4" 
                      variant="outline" 
                      onClick={handleAddBlock}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Off
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Add Block Dialog */}
            <Dialog open={isAddBlockDialogOpen} onOpenChange={setIsAddBlockDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {activeTab === 'weekly' ? 'Add Weekly Availability' : 'Schedule Time Off'}
                  </DialogTitle>
                </DialogHeader>
                
                {activeTab === 'weekly' ? (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="day" className="text-right">
                        Day
                      </Label>
                      <Select 
                        value={newDayOfWeek} 
                        onValueChange={setNewDayOfWeek}
                      >
                        <SelectTrigger className="col-span-3" id="day">
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startTime" className="text-right">
                        Start Time
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endTime" className="text-right">
                        End Time
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startDate" className="text-right">
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endDate" className="text-right">
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="note" className="text-right">
                        Note
                      </Label>
                      <Input
                        id="note"
                        placeholder="Optional note (e.g. Vacation)"
                        value={newTimeOffNote}
                        onChange={(e) => setNewTimeOffNote(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddBlockDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={activeTab === 'weekly' ? handleAddAvailability : handleAddTimeOff}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>

      <AvailabilitySettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        clinicianId={clinicianId}
        onSettingsUpdated={handleSettingsUpdated}
      />
    </Card>
  );
};

export default AvailabilityPanel;
