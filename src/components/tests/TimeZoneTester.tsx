import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ensureIANATimeZone, fromUTCTimestamp, toUTCTimestamp } from '@/utils/timeZoneUtils';
import { getAppointmentInUserTimeZone } from '@/utils/appointmentUtils';

const TimeZoneTester: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test time zones
  const timeZones = [
    'America/New_York',    // Eastern Time
    'America/Chicago',     // Central Time
    'America/Denver',      // Mountain Time
    'America/Los_Angeles', // Pacific Time
    'Europe/London',       // GMT/UTC
    'Asia/Tokyo'           // Japan Standard Time
  ];
  
  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    const results: any[] = [];
    
    try {
      // Create a test appointment in each time zone
      const testDate = new Date();
      const dateStr = format(testDate, 'yyyy-MM-dd');
      const timeStr = '14:00'; // 2:00 PM
      
      for (const sourceTimeZone of timeZones) {
        // Convert to UTC for storage
        const startTimestamp = toUTCTimestamp(dateStr, timeStr, sourceTimeZone);
        const endTimestamp = toUTCTimestamp(dateStr, '14:30', sourceTimeZone);
        
        // Create a test appointment object
        const testAppointment = {
          id: `test-${sourceTimeZone}`,
          client_id: 'test-client',
          clinician_id: 'test-clinician',
          date: dateStr,
          start_time: timeStr,
          end_time: '14:30',
          appointment_datetime: startTimestamp,
          appointment_end_datetime: endTimestamp,
          source_time_zone: sourceTimeZone,
          type: 'Test Session',
          status: 'scheduled'
        };
        
        // Test conversion to each target time zone
        for (const targetTimeZone of timeZones) {
          const convertedAppointment = getAppointmentInUserTimeZone(
            testAppointment, 
            targetTimeZone
          );
          
          // Calculate expected time in target time zone
          const expectedLocalTime = fromUTCTimestamp(startTimestamp, targetTimeZone);
          const expectedTimeStr = format(expectedLocalTime, 'HH:mm');
          
          // Check if conversion is correct
          const isCorrect = convertedAppointment.display_start_time === expectedTimeStr;
          
          results.push({
            sourceTimeZone,
            targetTimeZone,
            originalTime: timeStr,
            convertedTime: convertedAppointment.display_start_time,
            expectedTime: expectedTimeStr,
            isCorrect,
            utcTime: startTimestamp
          });
        }
      }
      
      setTestResults(results);
    } catch (err) {
      console.error('Error running time zone tests:', err);
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
      <h1 className="text-2xl font-bold mb-4">Time Zone Conversion Tester</h1>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p>Running time zone conversion tests...</p>
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
                  <th className="py-2 px-4 border">Source Time Zone</th>
                  <th className="py-2 px-4 border">Target Time Zone</th>
                  <th className="py-2 px-4 border">Original Time</th>
                  <th className="py-2 px-4 border">Converted Time</th>
                  <th className="py-2 px-4 border">Expected Time</th>
                  <th className="py-2 px-4 border">Result</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border">{result.sourceTimeZone}</td>
                    <td className="py-2 px-4 border">{result.targetTimeZone}</td>
                    <td className="py-2 px-4 border">{result.originalTime}</td>
                    <td className="py-2 px-4 border">{result.convertedTime}</td>
                    <td className="py-2 px-4 border">{result.expectedTime}</td>
                    <td className={`py-2 px-4 border ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isCorrect ? 'PASS' : 'FAIL'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p>
              Total Tests: {testResults.length}<br />
              Passed: {testResults.filter(r => r.isCorrect).length}<br />
              Failed: {testResults.filter(r => !r.isCorrect).length}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TimeZoneTester;
