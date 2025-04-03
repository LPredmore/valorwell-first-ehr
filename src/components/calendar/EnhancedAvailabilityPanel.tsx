
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Calendar } from 'lucide-react';
import TimeOffDialog from './TimeOffDialog';
import TimeOffBlocksList from './TimeOffBlocksList';
import AvailabilityPanel from './AvailabilityPanel';

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
            <TabsTrigger value="timeoff" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Time Off
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-0">
            <AvailabilityPanel 
              clinicianId={clinicianId} 
              onAvailabilityUpdated={onAvailabilityUpdated} 
              userTimeZone={userTimeZone}
            />
          </TabsContent>
          
          <TabsContent value="timeoff" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsTimeOffDialogOpen(true)}
                  size="sm"
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Off
                </Button>
              </div>
              
              <TimeOffBlocksList 
                clinicianId={clinicianId} 
                onTimeOffUpdated={onAvailabilityUpdated} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <TimeOffDialog 
        isOpen={isTimeOffDialogOpen} 
        onClose={() => setIsTimeOffDialogOpen(false)} 
        clinicianId={clinicianId}
        onTimeOffUpdated={onAvailabilityUpdated}
      />
    </Card>
  );
};

export default EnhancedAvailabilityPanel;
