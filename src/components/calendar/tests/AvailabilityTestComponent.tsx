
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * This component is used for testing and validating the availability model.
 * It displays all three availability sources and allows for verification.
 */
const AvailabilityTestComponent: React.FC<{ clinicianId: string }> = ({ clinicianId }) => {
  const [loading, setLoading] = useState(true);
  const [weeklySchedule, setWeeklySchedule] = useState<any>(null);
  const [singleDayAvailability, setSingleDayAvailability] = useState<any[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('weekly');
  const { toast } = useToast();

  // Fetch all availability sources
  useEffect(() => {
    const fetchAllAvailabilityData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch clinician weekly schedule
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select(`
            clinician_mondaystart1, clinician_mondayend1,
            clinician_mondaystart2, clinician_mondayend2,
            clinician_mondaystart3, clinician_mondayend3,
            clinician_tuesdaystart1, clinician_tuesdayend1,
            clinician_tuesdaystart2, clinician_tuesdayend2,
            clinician_tuesdaystart3, clinician_tuesdayend3,
            clinician_wednesdaystart1, clinician_wednesdayend1,
            clinician_wednesdaystart2, clinician_wednesdayend2,
            clinician_wednesdaystart3, clinician_wednesdayend3,
            clinician_thursdaystart1, clinician_thursdayend1,
            clinician_thursdaystart2, clinician_thursdayend2,
            clinician_thursdaystart3, clinician_thursdayend3,
            clinician_fridaystart1, clinician_fridayend1,
            clinician_fridaystart2, clinician_fridayend2,
            clinician_fridaystart3, clinician_fridayend3,
            clinician_saturdaystart1, clinician_saturdayend1,
            clinician_saturdaystart2, clinician_saturdayend2,
            clinician_saturdaystart3, clinician_saturdayend3,
            clinician_sundaystart1, clinician_sundayend1,
            clinician_sundaystart2, clinician_sundayend2,
            clinician_sundaystart3, clinician_sundayend3
          `)
          .eq('id', clinicianId)
          .single();
        
        // 2. Fetch single day availability
        const { data: singleDayData } = await supabase
          .from('single_day_availability')
          .select('*')
          .eq('clinician_id', clinicianId)
          .order('availability_date', { ascending: true });
        
        // 3. Fetch time blocks
        const { data: timeBlocksData } = await supabase
          .from('time_blocks')
          .select('*')
          .eq('clinician_id', clinicianId)
          .order('block_date', { ascending: true });
        
        if (clinicianError) {
          console.error('Error fetching clinician data:', clinicianError);
          toast({
            title: 'Error',
            description: `Failed to fetch clinician data: ${clinicianError.message}`,
            variant: 'destructive'
          });
        } else {
          // Process the weekly schedule
          const schedule = processWeeklySchedule(clinicianData);
          setWeeklySchedule(schedule);
          setSingleDayAvailability(singleDayData || []);
          setTimeBlocks(timeBlocksData || []);
        }
      } catch (error) {
        console.error('Error in availability test:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while testing availability',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllAvailabilityData();
  }, [clinicianId]);

  // Process weekly schedule into a more readable format
  const processWeeklySchedule = (clinicianData: any) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const result: Record<string, any> = {};
    
    days.forEach((day) => {
      result[day] = [];
      
      for (let i = 1; i <= 3; i++) {
        const startKey = `clinician_${day}start${i}`;
        const endKey = `clinician_${day}end${i}`;
        
        if (clinicianData[startKey] && clinicianData[endKey]) {
          result[day].push({
            slot: i,
            start_time: clinicianData[startKey],
            end_time: clinicianData[endKey]
          });
        }
      }
    });
    
    return result;
  };

  // Run tests to verify data consistency
  const runTests = () => {
    const testResults = [];
    
    // Test 1: Verify weekly schedule has all days
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const missingDays = days.filter(day => !weeklySchedule[day]);
    if (missingDays.length > 0) {
      testResults.push(`Weekly schedule is missing days: ${missingDays.join(', ')}`);
    }
    
    // Test 2: Check for time format consistency
    const timeFormatRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    
    // Check weekly schedule times
    Object.entries(weeklySchedule).forEach(([day, slots]) => {
      (slots as any[]).forEach((slot, index) => {
        if (!timeFormatRegex.test(slot.start_time)) {
          testResults.push(`Invalid start time format for ${day} slot ${index + 1}: ${slot.start_time}`);
        }
        if (!timeFormatRegex.test(slot.end_time)) {
          testResults.push(`Invalid end time format for ${day} slot ${index + 1}: ${slot.end_time}`);
        }
      });
    });
    
    // Check single day times
    singleDayAvailability.forEach(record => {
      if (!timeFormatRegex.test(record.start_time)) {
        testResults.push(`Invalid start time format for single day ${record.availability_date}: ${record.start_time}`);
      }
      if (!timeFormatRegex.test(record.end_time)) {
        testResults.push(`Invalid end time format for single day ${record.availability_date}: ${record.end_time}`);
      }
    });
    
    // Check time block times
    timeBlocks.forEach(block => {
      if (!timeFormatRegex.test(block.start_time)) {
        testResults.push(`Invalid start time format for time block ${block.block_date}: ${block.start_time}`);
      }
      if (!timeFormatRegex.test(block.end_time)) {
        testResults.push(`Invalid end time format for time block ${block.block_date}: ${block.end_time}`);
      }
    });
    
    if (testResults.length === 0) {
      toast({
        title: 'Tests Passed',
        description: 'All availability data is valid and consistent',
        variant: 'default'
      });
    } else {
      toast({
        title: 'Test Failures',
        description: `${testResults.length} issues found. Check console for details.`,
        variant: 'destructive'
      });
      console.error('Availability test failures:', testResults);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading availability data...</span>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Availability Test</h2>
        <Button onClick={runTests}>Run Tests</Button>
      </div>
      
      <Tabs defaultValue="weekly" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="single-day">Single Day</TabsTrigger>
          <TabsTrigger value="time-blocks">Time Blocks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly">
          <div className="space-y-4">
            {weeklySchedule && Object.entries(weeklySchedule).map(([day, slots]) => (
              <div key={day} className="border rounded-lg p-4">
                <h3 className="font-semibold capitalize mb-2">{day}</h3>
                {(slots as any[]).length > 0 ? (
                  <ul className="list-disc pl-6">
                    {(slots as any[]).map((slot, index) => (
                      <li key={index}>
                        Slot {slot.slot}: {slot.start_time} - {slot.end_time}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No availability</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="single-day">
          {singleDayAvailability.length > 0 ? (
            <div className="space-y-4">
              {singleDayAvailability.map(record => (
                <div key={record.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    {format(new Date(record.availability_date), 'MMMM d, yyyy')} (ID: {record.id.slice(0, 8)}...)
                  </h3>
                  <p>Start: {record.start_time}</p>
                  <p>End: {record.end_time}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No single-day availability records found.</p>
          )}
        </TabsContent>
        
        <TabsContent value="time-blocks">
          {timeBlocks.length > 0 ? (
            <div className="space-y-4">
              {timeBlocks.map(block => (
                <div key={block.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    {format(new Date(block.block_date), 'MMMM d, yyyy')} (ID: {block.id.slice(0, 8)}...)
                  </h3>
                  <p>Start: {block.start_time}</p>
                  <p>End: {block.end_time}</p>
                  {block.reason && <p>Reason: {block.reason}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No time blocks found.</p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AvailabilityTestComponent;
