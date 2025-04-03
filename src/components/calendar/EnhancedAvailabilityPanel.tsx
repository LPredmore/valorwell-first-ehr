
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Clock, Clock8 } from 'lucide-react';
import WeeklyAvailabilityPanel from './WeeklyAvailabilityPanel';
import TimeOffPanel from './TimeOffPanel';
import OneTimeAvailabilityPanel from './OneTimeAvailabilityPanel';

interface EnhancedAvailabilityPanelProps {
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
  userTimeZone?: string;
}

const EnhancedAvailabilityPanel: React.FC<EnhancedAvailabilityPanelProps> = ({
  clinicianId,
  onAvailabilityUpdated,
  userTimeZone
}) => {
  const [tab, setTab] = useState('weekly');

  return (
    <Card className="p-4 h-full">
      <h3 className="text-lg font-medium mb-4">Availability Settings</h3>
      
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="weekly" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly Hours
          </TabsTrigger>
          <TabsTrigger value="one-time" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            One-Time Hours
          </TabsTrigger>
          <TabsTrigger value="time-off" className="flex items-center">
            <Clock8 className="h-4 w-4 mr-2" />
            Time Off
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="pt-4">
          <WeeklyAvailabilityPanel 
            clinicianId={clinicianId}
            onAvailabilityUpdated={onAvailabilityUpdated}
            userTimeZone={userTimeZone}
          />
        </TabsContent>
        
        <TabsContent value="one-time" className="pt-4">
          <OneTimeAvailabilityPanel
            clinicianId={clinicianId}
            onAvailabilityUpdated={onAvailabilityUpdated}
            userTimeZone={userTimeZone}
          />
        </TabsContent>
        
        <TabsContent value="time-off" className="pt-4">
          <TimeOffPanel 
            clinicianId={clinicianId}
            onAvailabilityUpdated={onAvailabilityUpdated}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default EnhancedAvailabilityPanel;
