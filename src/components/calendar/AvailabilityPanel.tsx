
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

interface AvailabilityPanelProps {
  clinicianId?: string;
}

const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({ clinicianId }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Availability</CardTitle>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standard">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="standard" className="flex-1">Standard</TabsTrigger>
            <TabsTrigger value="exceptions" className="flex-1">Exceptions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="space-y-3">
            <div className="rounded-md border">
              <div className="flex justify-between items-center p-3 border-b">
                <div className="font-medium">Monday</div>
                <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
              </div>
              <div className="flex justify-between items-center p-3 border-b">
                <div className="font-medium">Tuesday</div>
                <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
              </div>
              <div className="flex justify-between items-center p-3 border-b">
                <div className="font-medium">Wednesday</div>
                <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
              </div>
              <div className="flex justify-between items-center p-3 border-b">
                <div className="font-medium">Thursday</div>
                <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
              </div>
              <div className="flex justify-between items-center p-3">
                <div className="font-medium">Friday</div>
                <div className="text-sm text-gray-500">9:00 AM - 3:00 PM</div>
              </div>
            </div>
            
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </TabsContent>
          
          <TabsContent value="exceptions" className="space-y-3">
            <div className="rounded-md border p-4 text-center text-gray-500">
              No exceptions configured
            </div>
            
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Exception
            </Button>
          </TabsContent>
        </Tabs>
        
        {clinicianId && (
          <div className="mt-4 text-xs text-gray-500">
            Showing availability for clinician ID: {clinicianId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityPanel;
