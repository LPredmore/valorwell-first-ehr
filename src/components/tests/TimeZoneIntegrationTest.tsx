
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZoneById } from '@/hooks/useUserTimeZone';
import { ensureIANATimeZone, formatTimeZoneDisplay } from '@/utils/timeZoneUtils';
import { convertAppointmentToLuxonFormat } from '@/utils/appointmentUtils';
import { AppointmentType } from '@/types/appointment';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateTime } from 'luxon';

interface TestCase {
  name: string;
  clientTimeZone: string;
  clinicianTimeZone: string;
  appointmentTime: string;
  expectedClientTime: string;
  expectedClinicianTime: string;
}

const TimeZoneIntegrationTest: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [testResults, setTestResults] = useState<Record<string, {
    testCase: TestCase;
    appointment: AppointmentType;
    clientView: AppointmentType;
    clinicianView: AppointmentType;
    passed: boolean;
    message: string;
  }>>({});

  useEffect(() => {
    const runTests = async () => {
      setLoading(true);
      
      // Define test cases for different time zone combinations
      const testCases: TestCase[] = [
        // PST to PST (same time zone)
        {
          name: 'PST to PST',
          clientTimeZone: 'America/Los_Angeles',
          clinicianTimeZone: 'America/Los_Angeles',
          appointmentTime: '09:00',
          expectedClientTime: '09:00',
          expectedClinicianTime: '09:00'
        },
        // EST to CST (3 hour difference)
        {
          name: 'EST to CST',
          clientTimeZone: 'America/New_York',
          clinicianTimeZone: 'America/Chicago',
          appointmentTime: '10:00',
          expectedClientTime: '10:00',
          expectedClinicianTime: '09:00'
        },
        // MST to EST (client books, clinician views - 2 hour difference)
        {
          name: 'MST to EST (client books)',
          clientTimeZone: 'America/Denver',
          clinicianTimeZone: 'America/New_York',
          appointmentTime: '10:00',
          expectedClientTime: '10:00',
          expectedClinicianTime: '12:00'
        },
        // PST to EST (clinician books, client views - 3 hour difference)
        {
          name: 'PST to EST (clinician books)',
          clientTimeZone: 'America/Los_Angeles',
          clinicianTimeZone: 'America/New_York',
          appointmentTime: '09:00',
          expectedClientTime: '06:00',
          expectedClinicianTime: '09:00'
        }
      ];
      
      const results: Record<string, any> = {};
      
      // Run each test case
      for (const testCase of testCases) {
        try {
          console.log(`Running test case: ${testCase.name}`);
          
          // Create a test appointment
          const now = new Date();
          const appointmentDate = format(now, 'yyyy-MM-dd');
          const appointmentTime = testCase.appointmentTime;
          
          // Determine source time zone based on test case
          // For "client books" cases, source is client time zone
          // For "clinician books" cases, source is clinician time zone
          const sourceTimeZone = testCase.name.includes('client books') 
            ? testCase.clientTimeZone 
            : testCase.clinicianTimeZone;
          
          // Create DateTime in the source timezone
          const startDt = DateTime.fromFormat(
            `${appointmentDate} ${appointmentTime}`, 
            'yyyy-MM-dd HH:mm', 
            { zone: sourceTimeZone }
          );
          
          // Add 30 minutes for end time
          const endDt = startDt.plus({ minutes: 30 });
          
          // Create test appointment data with ISO timestamps
          const appointment: AppointmentType = {
            id: `test-${testCase.name}`,
            client_id: 'test-client-id',
            clinician_id: 'test-clinician-id',
            start_at: startDt.toISO(),
            end_at: endDt.toISO(),
            type: 'Test Appointment',
            status: 'scheduled'
          };
          
          // Convert appointment to client view
          const clientAppointment = convertAppointmentToLuxonFormat(
            appointment,
            testCase.clientTimeZone
          );
          
          // Convert appointment to clinician view
          const clinicianAppointment = convertAppointmentToLuxonFormat(
            appointment,
            testCase.clinicianTimeZone
          );
          
          // Verify the test
          const clientTimeMatches = clientAppointment.display_start_time === testCase.expectedClientTime;
          const clinicianTimeMatches = clinicianAppointment.display_start_time === testCase.expectedClinicianTime;
          const passed = clientTimeMatches && clinicianTimeMatches;
          
          let message = passed 
            ? `Test passed! Times display correctly for both client and clinician.`
            : `Test failed! Client sees ${clientAppointment.display_start_time} (expected ${testCase.expectedClientTime}), Clinician sees ${clinicianAppointment.display_start_time} (expected ${testCase.expectedClinicianTime})`;
          
          results[testCase.name] = {
            testCase,
            appointment,
            clientView: clientAppointment,
            clinicianView: clinicianAppointment,
            passed,
            message
          };
          
          console.log(`Test case ${testCase.name} ${passed ? 'passed' : 'failed'}: ${message}`);
        } catch (error) {
          console.error(`Error in test case ${testCase.name}:`, error);
          results[testCase.name] = {
            testCase,
            appointment: null,
            clientView: null,
            clinicianView: null,
            passed: false,
            message: `Error running test: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
      
      setTestResults(results);
      setLoading(false);
    };
    
    runTests();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Time Zone Integration Tests</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
          <span className="ml-2">Running time zone integration tests...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
              <CardDescription>
                Testing appointment display across different time zone combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(testResults).map(([testName, result]) => (
                  <div 
                    key={testName} 
                    className={`border rounded-md p-4 ${
                      result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <h3 className="font-medium mb-2">{testName}</h3>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Client:</span> {formatTimeZoneDisplay(result.testCase.clientTimeZone)},&nbsp;
                      <span className="font-medium">Clinician:</span> {formatTimeZoneDisplay(result.testCase.clinicianTimeZone)}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Original Time:</span> {result.testCase.appointmentTime}
                    </p>
                    <p className={`text-sm font-medium ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </p>
                    <p className="text-xs mt-1">{result.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue={Object.keys(testResults)[0] || ''}>
            <TabsList className="mb-4">
              {Object.keys(testResults).map(testName => (
                <TabsTrigger key={testName} value={testName}>
                  {testName}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(testResults).map(([testName, result]) => (
              <TabsContent key={testName} value={testName} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{testName} - Detailed Results</CardTitle>
                    <CardDescription>
                      Test configuration and conversion details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 rounded-md bg-muted">
                        <h3 className="font-medium mb-2">Test Configuration</h3>
                        <p><span className="font-medium">Client Time Zone:</span> {formatTimeZoneDisplay(result.testCase.clientTimeZone)}</p>
                        <p><span className="font-medium">Clinician Time Zone:</span> {formatTimeZoneDisplay(result.testCase.clinicianTimeZone)}</p>
                        <p><span className="font-medium">Original Appointment Time:</span> {result.testCase.appointmentTime}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-2">Client View</h3>
                          <p><span className="text-muted-foreground">Date:</span> {result.clientView?.display_date}</p>
                          <p><span className="text-muted-foreground">Start Time:</span> {result.clientView?.display_start_time}</p>
                          <p><span className="text-muted-foreground">End Time:</span> {result.clientView?.display_end_time}</p>
                          <p><span className="text-muted-foreground">Expected Time:</span> {result.testCase.expectedClientTime}</p>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-2">Clinician View</h3>
                          <p><span className="text-muted-foreground">Date:</span> {result.clinicianView?.display_date}</p>
                          <p><span className="text-muted-foreground">Start Time:</span> {result.clinicianView?.display_start_time}</p>
                          <p><span className="text-muted-foreground">End Time:</span> {result.clinicianView?.display_end_time}</p>
                          <p><span className="text-muted-foreground">Expected Time:</span> {result.testCase.expectedClinicianTime}</p>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-md ${result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <h3 className="font-medium mb-2">Test Result: {result.passed ? 'PASSED' : 'FAILED'}</h3>
                        <p>{result.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default TimeZoneIntegrationTest;
