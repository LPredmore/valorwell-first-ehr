import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayOfWeek, WeeklyAvailability } from '@/types/availability';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import AvailabilitySlotList from './AvailabilitySlotList';
import AvailabilityForm from './AvailabilityForm';
import { PermissionLevel } from '@/services/PermissionService';

export interface DayTabsProps {
  activeTab: DayOfWeek;
  onTabChange: (tab: DayOfWeek) => void;
  weeklyAvailability: WeeklyAvailability | null;
  timeZone: string;
  onDeleteSlot: (slotId: string, isRecurring: boolean) => void;
  onAddSlot: (startTime: string, endTime: string) => Promise<void>;
  isSubmitting: boolean;
  formError: string | null;
  retryCount: number;
  permissionLevel?: PermissionLevel;
}

/**
 * DayTabs - A component for displaying and managing availability by day of week
 * 
 * This component provides a tabbed interface for viewing and managing availability
 * for each day of the week. It includes the slot list and form for adding new slots.
 */
const DayTabs: React.FC<DayTabsProps> = ({
  activeTab,
  onTabChange,
  weeklyAvailability,
  timeZone,
  onDeleteSlot,
  onAddSlot,
  isSubmitting,
  formError,
  retryCount,
  permissionLevel = 'admin'
}) => {
  return (
    <Tabs defaultValue={activeTab} onValueChange={(value) => onTabChange(value as DayOfWeek)}>
      <TabsList className="grid grid-cols-7">
        <TabsTrigger value="monday">Mon</TabsTrigger>
        <TabsTrigger value="tuesday">Tue</TabsTrigger>
        <TabsTrigger value="wednesday">Wed</TabsTrigger>
        <TabsTrigger value="thursday">Thu</TabsTrigger>
        <TabsTrigger value="friday">Fri</TabsTrigger>
        <TabsTrigger value="saturday">Sat</TabsTrigger>
        <TabsTrigger value="sunday">Sun</TabsTrigger>
      </TabsList>
      
      {permissionLevel !== 'admin' && (
        <Alert variant="warning" className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            You may have limited permissions to manage this calendar.
            {permissionLevel === 'none' ? " You can only view availability." :
             permissionLevel === 'read' ? " You can only view availability." :
             " Some actions may be restricted."}
          </AlertDescription>
        </Alert>
      )}
      
      {weeklyAvailability && Object.keys(weeklyAvailability).map((day) => (
        <TabsContent key={day} value={day} className="p-4 bg-white border rounded-md mt-4">
          <h3 className="text-lg font-semibold mb-4 capitalize">{day}</h3>
          
          <AvailabilitySlotList
            slots={weeklyAvailability[day as DayOfWeek]}
            timeZone={timeZone}
            onDeleteSlot={onDeleteSlot}
            permissionLevel={permissionLevel as any}
          />
          
          <AvailabilityForm
            day={day as DayOfWeek}
            onAddSlot={onAddSlot}
            isSubmitting={isSubmitting}
            formError={formError}
            retryCount={retryCount}
            timeZone={timeZone}
            permissionLevel={permissionLevel as any}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default DayTabs;