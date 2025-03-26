
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import CalendarView from '../components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Users, Clock } from 'lucide-react';

type ViewType = 'day' | 'week' | 'month';

const Calendar = () => {
  const [view, setView] = useState<ViewType>('week');
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <Tabs defaultValue="week" value={view} onValueChange={(value) => setView(value as ViewType)}>
                <TabsList>
                  <TabsTrigger value="day">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="week">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button 
                variant={showAvailability ? "default" : "outline"} 
                onClick={() => setShowAvailability(!showAvailability)}
              >
                <Clock className="mr-2 h-4 w-4" />
                Availability
              </Button>
            </div>
          </div>
          
          <CalendarView view={view} showAvailability={showAvailability} />
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
