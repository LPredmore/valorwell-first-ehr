
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarViewType } from '@/types/calendar';
import Layout from '../components/layout/Layout';
import { Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarState } from '../hooks/useCalendarState';
import { useToast } from '@/hooks/use-toast';
import FullCalendarView from '../components/calendar/FullCalendarView';
import { useTimeZone } from '@/context/TimeZoneContext';

const CalendarPage: React.FC = () => {
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const {
    selectedClinicianId,
    showAvailability
  } = useCalendarState();
  const { toast } = useToast();
  const { userTimeZone } = useTimeZone();

  const handleCalendarRefresh = useCallback(() => {
    console.log('[Calendar] Manually refreshing calendar');
    setCalendarKey(prev => prev + 1);
    toast({
      title: "Calendar Refreshed",
      description: "Your calendar has been updated with the latest data.",
    });
  }, [toast]);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          <Button 
            variant="ghost" 
            onClick={handleCalendarRefresh} 
            title="Refresh Calendar"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {selectedClinicianId ? (
          <FullCalendarView 
            key={calendarKey}
            clinicianId={selectedClinicianId} 
            showAvailability={showAvailability}
            userTimeZone={userTimeZone}
          />
        ) : (
          <div className="text-center text-gray-500">
            Select a clinician to view their calendar
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;
