import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ensureIANATimeZone, fromUTCTimestamp, toUTCTimestamp } from '@/utils/timeZoneUtils';
import { getAppointmentInUserTimeZone } from '@/utils/appointmentUtils';

const TimeZoneIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test scenarios
  const scenarios = [
    {
      name: "EST clinician, CST client - 9am appointment",
      clinicianTimeZone: "America/New_York",
      clientTimeZone: "America/Chicago",
      appointmentTime: "09:00",
      expectedClientTime: "08:00"
    },
    {
      name: "MST client, EST clinician - 10am appointment",
      clinicianTimeZone: "America/New_York",
      clientTimeZone: "America/Denver",
      appointmentTime: "12:00",
      expectedClientTime: "10:00"
    },
    {
      name: "PST client, EST clinician - evening appointment",
      clinicianTimeZone: "America/New_York",
      clientTimeZone: "America/Los_Angeles",
      appointmentTime: "19:00",
      expectedClientTime: "16:00"
    },
    {
      name: "CST client, PST clinician - morning appointment",
      clinicianTimeZone: "America/Los_Angeles",
      clientTimeZone: "America/Chicago",
      appointmentTime: "09:00",
      expectedClientTime: "11:00"
    }
  ];
  
  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    const results: any[] = [];
    
    try {
      // Create a test appointment for each scenario
      const testDate = new Date();
      const dateStr = format(testDate, 'yyyy-MM-dd');
      
      for (const scenario of scenarios) {
        // 1. Clinician creates appointment in their time zone
        const startTimestamp = toUTCTimestamp(dateStr, scenario.appointmentTime, scenario.clinicianTimeZone);
        
        // Calculate end time (30 minutes later)
        const [hours, minutes] = scenario.appointmentTime.split(':').map(Number);
        const endMinutes = (minutes + 30) % 60;
        const endHours = hours + Math.floor((minutes + 30) / 60);
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        const endTimestamp = toUTCTimestamp(dateStr, endTime, scenario.clinicianTimeZone);
        
        // 2. Create appointment object as it would be stored in database
        const testAppointment = {
          id: `test-${scenario.name}`,
          client_id: 'test-client',
          clinician_id: 'test-clinician',
          date: dateStr,
          start_time: scenario.appointmentTime,
          end_time: endTime,
          appointment_datetime: startTimestamp,
          appointment_end_datetime: endTimestamp,
          source_time_zone: scenario.clinicianTimeZone,
          type: 'Test Session',
          status: 'scheduled'
        };
        
        // 3. Convert to client's time zone (what client would see)
        const clientView = getAppointmentInUserTimeZone(
          testAppointment, 
          scenario.clientTimeZone
        );
        
        // 4. Convert to clinician's time zone (what clinician would see)
        const clinicianView = getAppointmentInUserTimeZone(
          testAppointment, 
          scenario.clinicianTimeZone
        );
        
        // 5. Check if conversion matches expected results
        const clientTimeCorrect = clientView.display_start_time === scenario.expectedClientTime;
        const clinicianTimeCorrect = clinicianView.display_start_time === scenario.appointmentTime;
        
        results.push({
          scenario: scenario.name,
          clinicianTimeZone: scenario.clinicianTimeZone,
          clientTimeZone: scenario.clientTimeZone,
          originalTime: scenario.appointmentTime,
          clientTime: clientView.display_start_time,
          expectedClientTime: scenario.expectedClientTime,
          clinicianTime: clinicianView.display_start_time,
          clientTimeCorrect,
          clinicianTimeCorrect,
          utcTime: startTimestamp
        });
      }
      
      setTestResults(results);
    } catch (err) {
      console.error('Error running time zone integration tests:', err);
      setError(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    runTests();
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Time Zone Integration Test</h1>
      <p className="mb-4">This test simulates real-world scenarios where clinicians and clients are in different time zones.</p>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p>Running time zone integration tests...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <button 
              onClick={runTests}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Run Tests Again
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Scenario</th>
                  <th className="py-2 px-4 border">Clinician Time Zone</th>
                  <th className="py-2 px-4 border">Client Time Zone</th>
                  <th className="py-2 px-4 border">Original Time</th>
                  <th className="py-2 px-4 border">Client Sees</th>
                  <th className="py-2 px-4 border">Expected Client Time</th>
                  <th className="py-2 px-4 border">Clinician Sees</th>
                  <th className="py-2 px-4 border">Result</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border">{result.scenario}</td>
                    <td className="py-2 px-4 border">{result.clinicianTimeZone}</td>
                    <td className="py-2 px-4 border">{result.clientTimeZone}</td>
                    <td className="py-2 px-4 border">{result.originalTime}</td>
                    <td className="py-2 px-4 border">{result.clientTime}</td>
                    <td className="py-2 px-4 border">{result.expectedClientTime}</td>
                    <td className="py-2 px-4 border">{result.clinicianTime}</td>
                    <td className={`py-2 px-4 border ${result.clientTimeCorrect && result.clinicianTimeCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {result.clientTimeCorrect && result.clinicianTimeCorrect ? 'PASS' : 'FAIL'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p>
              Total Scenarios: {testResults.length}<br />
              Passed: {testResults.filter(r => r.clientTimeCorrect && r.clinicianTimeCorrect).length}<br />
              Failed: {testResults.filter(r => !r.clientTimeCorrect || !r.clinicianTimeCorrect).length}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TimeZoneIntegrationTest;
