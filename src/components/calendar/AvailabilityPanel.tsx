import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AvailabilitySettingsDialog from './AvailabilitySettingsDialog';

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (clinicianId) {
      fetchAvailabilityBlocks();
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

  const handleSettingsUpdated = () => {
    onAvailabilityUpdated();
  };
  
  // Function to format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return format(new Date(0, 0, 0, parseInt(hours), parseInt(minutes)), 'h:mm a');
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
        ) : availabilityBlocks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No availability blocks set up yet</p>
            <Button onClick={() => { /* Add availability */ }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
              onClick={() => { /* Add availability */ }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
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
