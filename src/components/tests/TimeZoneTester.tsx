
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
import { DateTime } from 'luxon';

const PST_TIME_ZONE = 'America/Los_Angeles';

const TimeZoneTester: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [testAppointment, setTestAppointment] = useState<AppointmentType | null>(null);
  const [clientTimeZone, setClientTimeZone] = useState<string>(PST_TIME_ZONE);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>(PST_TIME_ZONE);
  const [clientView, setClientView] = useState<AppointmentType | null>(null);
  const [clinicianView, setClinicianView] = useState<AppointmentType | null>(null);
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');

  useEffect(() => {
    const createTestAppointment = async () => {
      setLoading(true);
      try {
        // Create a test appointment with both client and clinician in PST
        const now = new Date();
        const appointmentTime = '09:00'; // 9 AM
        const appointmentEndTime = '09:30'; // 9:30 AM
        
        const startDt = DateTime.fromFormat(`${format(now, 'yyyy-MM-dd')} ${appointmentTime}`, 'yyyy-MM-dd HH:mm', { zone: PST_TIME_ZONE });
        const endDt = DateTime.fromFormat(`${format(now, 'yyyy-MM-dd')} ${appointmentEndTime}`, 'yyyy-MM-dd HH:mm', { zone: PST_TIME_ZONE });
        
        // Create test appointment data
        const appointment: AppointmentType = {
          id: 'test-appointment-id',
          client_id: 'test-client-id',
          clinician_id: 'test-clinician-id',
          start_at: startDt.toISO(),
          end_at: endDt.toISO(),
          type: 'Test Appointment',
          status: 'scheduled'
        };
        
        setTestAppointment(appointment);
        
        // Convert appointment to client view (PST)
        const clientAppointment = convertAppointmentToLuxonFormat(
          appointment,
          clientTimeZone
        );
        setClientView(clientAppointment);
        
        // Convert appointment to clinician view (PST)
        const clinicianAppointment = convertAppointmentToLuxonFormat(
          appointment,
          clinicianTimeZone
        );
        setClinicianView(clinicianAppointment);
        
        // Verify the test
        if (clientAppointment.display_start_time === appointmentTime && 
            clinicianAppointment.display_start_time === appointmentTime) {
          setTestResult('success');
          setTestMessage('PST to PST conversion test passed! Appointments display at the correct time.');
        } else {
          setTestResult('failure');
          setTestMessage(`PST to PST conversion test failed! Client sees ${clientAppointment.display_start_time}, Clinician sees ${clinicianAppointment.display_start_time}, Expected: ${appointmentTime}`);
        }
      } catch (error) {
        console.error('Error in time zone test:', error);
        setTestResult('failure');
        setTestMessage('Error running time zone test: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setLoading(false);
      }
    };
    
    createTestAppointment();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Time Zone Conversion Tester</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
          <span className="ml-2">Running time zone tests...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PST to PST Conversion Test</CardTitle>
              <CardDescription>
                Testing appointment display when both client and clinician are in PST
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-muted">
                  <h3 className="font-medium mb-2">Test Configuration</h3>
                  <p><span className="font-medium">Client Time Zone:</span> {formatTimeZoneDisplay(clientTimeZone)}</p>
                  <p><span className="font-medium">Clinician Time Zone:</span> {formatTimeZoneDisplay(clinicianTimeZone)}</p>
                  <p><span className="font-medium">Original Appointment Time:</span> {clientView?.display_start_time}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Client View</h3>
                    <p><span className="text-muted-foreground">Date:</span> {clientView?.display_date}</p>
                    <p><span className="text-muted-foreground">Start Time:</span> {clientView?.display_start_time}</p>
                    <p><span className="text-muted-foreground">End Time:</span> {clientView?.display_end_time}</p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Clinician View</h3>
                    <p><span className="text-muted-foreground">Date:</span> {clinicianView?.display_date}</p>
                    <p><span className="text-muted-foreground">Start Time:</span> {clinicianView?.display_start_time}</p>
                    <p><span className="text-muted-foreground">End Time:</span> {clinicianView?.display_end_time}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-md ${testResult === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <h3 className="font-medium mb-2">Test Result: {testResult === 'success' ? 'PASSED' : 'FAILED'}</h3>
                  <p>{testMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
              <CardDescription>
                Raw appointment data and conversion information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Original Appointment Data</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(testAppointment, null, 2)}
                  </pre>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Client View (Converted)</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(clientView, null, 2)}
                  </pre>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Clinician View (Converted)</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(clinicianView, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TimeZoneTester;
