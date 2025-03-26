
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, X, Copy } from 'lucide-react';

interface TimeRange {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

const AvailabilityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('set');
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  
  // Sample availability time ranges
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { id: '1', day: 'Monday', startTime: '09:00', endTime: '17:00' },
    { id: '2', day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
    { id: '3', day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
    { id: '4', day: 'Thursday', startTime: '09:00', endTime: '17:00' },
    { id: '5', day: 'Friday', startTime: '09:00', endTime: '17:00' },
  ]);
  
  const handleDeleteTimeRange = (id: string) => {
    setTimeRanges(timeRanges.filter(range => range.id !== id));
  };
  
  const addNewTimeRange = () => {
    const newId = (timeRanges.length + 1).toString();
    setTimeRanges([...timeRanges, {
      id: newId,
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00'
    }]);
  };
  
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
            <div className="space-y-3">
              {timeRanges.map((range) => (
                <div key={range.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                  <Badge variant="outline">{range.day}</Badge>
                  <div className="text-sm">
                    {range.startTime} - {range.endTime}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={() => handleDeleteTimeRange(range.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              onClick={addNewTimeRange}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
            
            <Button className="w-full">
              Save Availability
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
                https://valorwell.app/book/clinician123
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <Button className="w-full">
              Generate New Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityPanel;
