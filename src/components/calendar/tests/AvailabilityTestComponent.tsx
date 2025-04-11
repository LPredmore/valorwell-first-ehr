
import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

interface TestResults {
  success: boolean;
  message: string;
  details?: any;
}

const AvailabilityTestComponent = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [testResults, setTestResults] = useState<TestResults[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    fetchUserId();
  }, []);

  const runWeeklyAvailabilityTest = async () => {
    setIsLoading(true);
    const results: TestResults[] = [];
    
    try {
      // Test 1: Fetch clinician data with availability columns
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select(`
          clinician_mondaystart1, clinician_mondayend1,
          clinician_tuesdaystart1, clinician_tuesdayend1,
          clinician_wednesdaystart1, clinician_wednesdayend1,
          clinician_thursdaystart1, clinician_thursdayend1,
          clinician_fridaystart1, clinician_fridayend1,
          clinician_saturdaystart1, clinician_saturdayend1,
          clinician_sundaystart1, clinician_sundayend1
        `)
        .eq('id', userId)
        .single();
        
      if (clinicianError) {
        results.push({
          success: false,
          message: 'Failed to fetch clinician data',
          details: clinicianError
        });
      } else {
        // Check if we have any weekly availability data
        const hasWeeklyData = Object.keys(clinicianData).some(key => 
          key.startsWith('clinician_') && key.includes('start') && clinicianData[key] !== null
        );
        
        results.push({
          success: true,
          message: hasWeeklyData 
            ? 'Successfully retrieved weekly availability from clinician record' 
            : 'Clinician record found, but no weekly availability is defined',
          details: clinicianData
        });
      }
      
      // Test 2: Call the edge function to get availability settings
      const response = await fetch(`${window.location.origin}/functions/v1/get-availability-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ clinicianId: userId })
      });
      
      if (!response.ok) {
        results.push({
          success: false,
          message: 'Edge function failed to return availability settings',
          details: { status: response.status, statusText: response.statusText }
        });
      } else {
        const settingsData = await response.json();
        results.push({
          success: true,
          message: 'Edge function returned availability settings successfully',
          details: settingsData
        });
        
        // Additional check for weekly_schedule property in response
        if (settingsData.weekly_schedule) {
          results.push({
            success: true,
            message: 'Edge function returned processed weekly schedule',
            details: settingsData.weekly_schedule
          });
        } else {
          results.push({
            success: false,
            message: 'Edge function response is missing weekly_schedule property',
            details: null
          });
        }
      }
    } catch (error) {
      results.push({
        success: false,
        message: 'Exception during weekly availability test',
        details: error
      });
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  const runSingleDayAvailabilityTest = async () => {
    setIsLoading(true);
    const results: TestResults[] = [];
    
    try {
      // First make sure the table exists
      const { data: tableExists, error: tableError } = await supabase
        .rpc('check_table_exists', { check_table_name: 'single_day_availability' });
        
      if (tableError || !tableExists) {
        results.push({
          success: false,
          message: 'single_day_availability table does not exist',
          details: tableError || 'Table not found'
        });
      } else {
        results.push({
          success: true,
          message: 'single_day_availability table exists',
          details: null
        });
        
        // Try to insert test data
        const testDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
        
        const { data: insertData, error: insertError } = await supabase
          .from('single_day_availability')
          .insert({
            clinician_id: userId,
            availability_date: testDate,
            start_time: '09:00',
            end_time: '17:00'
          })
          .select();
          
        if (insertError) {
          results.push({
            success: false,
            message: 'Failed to insert test single-day availability',
            details: insertError
          });
        } else {
          results.push({
            success: true,
            message: 'Successfully inserted test single-day availability',
            details: insertData
          });
          
          // Try to retrieve the test data
          const { data: retrieveData, error: retrieveError } = await supabase
            .from('single_day_availability')
            .select('*')
            .eq('clinician_id', userId)
            .eq('availability_date', testDate);
            
          if (retrieveError) {
            results.push({
              success: false,
              message: 'Failed to retrieve test single-day availability',
              details: retrieveError
            });
          } else {
            results.push({
              success: true,
              message: 'Successfully retrieved test single-day availability',
              details: retrieveData
            });
          }
          
          // Clean up the test data
          const { error: deleteError } = await supabase
            .from('single_day_availability')
            .delete()
            .eq('clinician_id', userId)
            .eq('availability_date', testDate);
            
          if (deleteError) {
            results.push({
              success: false,
              message: 'Failed to clean up test single-day availability',
              details: deleteError
            });
          } else {
            results.push({
              success: true,
              message: 'Successfully cleaned up test single-day availability',
              details: null
            });
          }
        }
      }
    } catch (error) {
      results.push({
        success: false,
        message: 'Exception during single-day availability test',
        details: error
      });
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  const runTimeBlocksTest = async () => {
    setIsLoading(true);
    const results: TestResults[] = [];
    
    try {
      // First make sure the table exists
      const { data: tableExists, error: tableError } = await supabase
        .rpc('check_table_exists', { check_table_name: 'time_blocks' });
        
      if (tableError || !tableExists) {
        results.push({
          success: false,
          message: 'time_blocks table does not exist',
          details: tableError || 'Table not found'
        });
      } else {
        results.push({
          success: true,
          message: 'time_blocks table exists',
          details: null
        });
        
        // Try to insert test data
        const testDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
        
        const { data: insertData, error: insertError } = await supabase
          .from('time_blocks')
          .insert({
            clinician_id: userId,
            block_date: testDate,
            start_time: '12:00',
            end_time: '13:00',
            reason: 'Test time block'
          })
          .select();
          
        if (insertError) {
          results.push({
            success: false,
            message: 'Failed to insert test time block',
            details: insertError
          });
        } else {
          results.push({
            success: true,
            message: 'Successfully inserted test time block',
            details: insertData
          });
          
          // Try to retrieve the test data
          const { data: retrieveData, error: retrieveError } = await supabase
            .from('time_blocks')
            .select('*')
            .eq('clinician_id', userId)
            .eq('block_date', testDate);
            
          if (retrieveError) {
            results.push({
              success: false,
              message: 'Failed to retrieve test time block',
              details: retrieveError
            });
          } else {
            results.push({
              success: true,
              message: 'Successfully retrieved test time block',
              details: retrieveData
            });
          }
          
          // Clean up the test data
          const { error: deleteError } = await supabase
            .from('time_blocks')
            .delete()
            .eq('clinician_id', userId)
            .eq('block_date', testDate);
            
          if (deleteError) {
            results.push({
              success: false,
              message: 'Failed to clean up test time block',
              details: deleteError
            });
          } else {
            results.push({
              success: true,
              message: 'Successfully cleaned up test time block',
              details: null
            });
          }
        }
      }
    } catch (error) {
      results.push({
        success: false,
        message: 'Exception during time blocks test',
        details: error
      });
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  const runEdgeFunctionTest = async () => {
    setIsLoading(true);
    const results: TestResults[] = [];
    
    try {
      // Test the edge function
      const response = await fetch(`${window.location.origin}/functions/v1/get-availability-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ clinicianId: userId })
      });
      
      if (!response.ok) {
        results.push({
          success: false,
          message: 'Edge function call failed',
          details: { status: response.status, statusText: response.statusText }
        });
      } else {
        const data = await response.json();
        results.push({
          success: true,
          message: 'Edge function returned data successfully',
          details: data
        });
        
        // Check for key properties
        const checkProperties = [
          'weekly_schedule', 
          'supports_single_date_availability', 
          'supports_time_blocks'
        ];
        
        checkProperties.forEach(prop => {
          if (data.hasOwnProperty(prop)) {
            results.push({
              success: true,
              message: `Edge function includes ${prop} property`,
              details: data[prop]
            });
          } else {
            results.push({
              success: false,
              message: `Edge function is missing ${prop} property`,
              details: null
            });
          }
        });
      }
    } catch (error) {
      results.push({
        success: false,
        message: 'Exception during edge function test',
        details: error
      });
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability System Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="border rounded-md"
              />
              
              <div className="space-y-2">
                <p>Selected Date: {format(selectedDate, 'PPPP')}</p>
                <p>User ID: {userId || 'Not logged in'}</p>
              </div>
            </div>
            
            <Tabs defaultValue="weekly">
              <TabsList>
                <TabsTrigger value="weekly">Weekly Availability</TabsTrigger>
                <TabsTrigger value="single-day">Single-Day Availability</TabsTrigger>
                <TabsTrigger value="time-blocks">Time Blocks</TabsTrigger>
                <TabsTrigger value="edge-function">Edge Function</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Test Weekly Availability</h3>
                  <Button onClick={runWeeklyAvailabilityTest} disabled={isLoading || !userId}>
                    {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Run Test
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Tests the weekly availability stored in the clinician table and 
                  the processing in the edge function.
                </p>
              </TabsContent>
              
              <TabsContent value="single-day" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Test Single-Day Availability</h3>
                  <Button onClick={runSingleDayAvailabilityTest} disabled={isLoading || !userId}>
                    {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Run Test
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Tests the single_day_availability table by inserting, retrieving, and deleting a test record.
                </p>
              </TabsContent>
              
              <TabsContent value="time-blocks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Test Time Blocks</h3>
                  <Button onClick={runTimeBlocksTest} disabled={isLoading || !userId}>
                    {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Run Test
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Tests the time_blocks table by inserting, retrieving, and deleting a test record.
                </p>
              </TabsContent>
              
              <TabsContent value="edge-function" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Test Edge Function</h3>
                  <Button onClick={runEdgeFunctionTest} disabled={isLoading || !userId}>
                    {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Run Test
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Tests the get-availability-settings edge function to ensure it returns all required data.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              >
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h4 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </h4>
                </div>
                {result.details && (
                  <div className="mt-2 text-sm">
                    <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityTestComponent;
