
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Calendar } from 'lucide-react';
import TimeOffDialog from './TimeOffDialog';
import TimeOffBlocksList from './TimeOffBlocksList';
import AvailabilityPanel from './AvailabilityPanel';
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
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Availability Management</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="weekly" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Weekly Hours
            </TabsTrigger>
            <TabsTrigger value="onetime" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              One-Time Hours
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-0">
            <AvailabilityPanel 
              clinicianId={clinicianId} 
              onAvailabilityUpdated={onAvailabilityUpdated} 
              userTimeZone={userTimeZone}
            />
          </TabsContent>
          
          <TabsContent value="onetime" className="mt-0">
            <OneTimeAvailabilityPanel
              clinicianId={clinicianId}
              onAvailabilityUpdated={onAvailabilityUpdated}
              userTimeZone={userTimeZone}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedAvailabilityPanel;
