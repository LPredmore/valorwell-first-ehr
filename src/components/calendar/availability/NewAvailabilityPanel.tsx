
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyAvailability from './WeeklyAvailability';
import { CalendarClock } from 'lucide-react';
import { AvailabilityProvider } from './AvailabilityContext';
import { useToast } from '@/hooks/use-toast';
import { CalendarService } from '@/services/calendarService';

interface NewAvailabilityPanelProps {
  clinicianId: string | null;
}

const NewAvailabilityPanel: React.FC<NewAvailabilityPanelProps> = ({ clinicianId }) => {
  const [activeTab, setActiveTab] = useState<string>('weekly');
  const [enabledDays, setEnabledDays] = useState<boolean[]>([false, true, true, true, true, true, false]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrated, setIsMigrated] = useState(true);
  
  useEffect(() => {
    // Check for migration status - simplified version: just assume we need to run migration
    setIsMigrated(false);
  }, [clinicianId]);
  
  const handleToggleDay = (dayIndex: number, enabled: boolean) => {
    const newEnabledDays = [...enabledDays];
    newEnabledDays[dayIndex] = enabled;
    setEnabledDays(newEnabledDays);
  };
  
  const handleMigrateData = async () => {
    if (!clinicianId) return;
    
    setIsLoading(true);
    try {
      await CalendarService.migrateData();
      
      toast({
        title: "Migration Complete",
        description: "Your availability data has been successfully migrated to the new calendar system.",
      });
      
      setIsMigrated(true);
    } catch (error) {
      console.error("Error migrating data:", error);
      toast({
        title: "Migration Error",
        description: "There was a problem migrating your availability data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AvailabilityProvider clinicianId={clinicianId}>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Availability</h2>
          <div className="flex items-center gap-2">
            {!isMigrated && (
              <Button 
                variant="outline"
                onClick={handleMigrateData}
                disabled={isLoading}
              >
                {isLoading ? "Migrating..." : "Migrate Legacy Data"}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <Badge variant="outline" className="text-sm">
            Manage Your Availability
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <div className="space-y-6">
              {Array.from({ length: 7 }, (_, i) => {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return (
                  <WeeklyAvailability
                    key={i}
                    dayIndex={i}
                    dayName={dayNames[i]}
                    slots={[]}
                    enabled={enabledDays[i]}
                    onToggleDay={handleToggleDay}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="exceptions">
            {/* Exception management will be implemented in the next phase */}
            <div className="text-center p-8 text-gray-500">
              <CalendarClock className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Coming Soon</p>
              <p>Exception management will be available in the next update.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AvailabilityProvider>
  );
};

export default NewAvailabilityPanel;
