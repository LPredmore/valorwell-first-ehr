import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { 
  generateTestEvents, 
  runCalendarPerformanceTest, 
  analyzePerformanceResults,
  TestResult
} from '@/utils/performance/calendarPerformanceTest';
import { componentMonitor } from '@/utils/performance/componentMonitor';
import FullCalendarView from './FullCalendarView';
import { CalendarEvent } from '@/types/calendar';

/**
 * Component to test and demonstrate calendar performance optimizations
 */
const CalendarPerformanceTest: React.FC = () => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    recommendations: string[];
    scalability: 'good' | 'moderate' | 'poor';
  } | null>(null);
  const [testEvents, setTestEvents] = useState<CalendarEvent[]>([]);
  const [eventCount, setEventCount] = useState(100);

  // Function to render the calendar with test events
  const renderTestCalendar = useCallback(async (events: CalendarEvent[]): Promise<number> => {
    return new Promise((resolve) => {
      // Reset component monitor
      componentMonitor.reset();
      
      // Set test events to trigger render
      setTestEvents(events);
      
      // Wait for render to complete and measure time
      setTimeout(() => {
        const stats = componentMonitor.getStats();
        const renderTime = stats.componentStats['FullCalendarView']?.averageRenderTime || 0;
        resolve(renderTime);
      }, 500); // Allow time for render to complete
    });
  }, []);

  // Run performance test
  const runTest = useCallback(async () => {
    setIsRunningTest(true);
    setTestResults([]);
    setAnalysis(null);
    
    try {
      // Run performance test with smaller event counts for demo
      const results = await runCalendarPerformanceTest(
        renderTestCalendar,
        {
          eventCounts: [10, 50, 100, 200],
          iterations: 2,
          logResults: true
        }
      );
      
      // Set results
      setTestResults(results);
      
      // Analyze results
      const performanceAnalysis = analyzePerformanceResults(results);
      setAnalysis(performanceAnalysis);
      
      // Set a reasonable number of events for display
      setEventCount(100);
      setTestEvents(generateTestEvents(100));
      
    } catch (error) {
      console.error('Error running performance test:', error);
    } finally {
      setIsRunningTest(false);
    }
  }, [renderTestCalendar]);

  // Generate test events for display
  const generateEvents = useCallback((count: number) => {
    setTestEvents(generateTestEvents(count));
  }, []);

  // Initialize with some test events
  useEffect(() => {
    generateEvents(eventCount);
  }, [generateEvents, eventCount]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Calendar Performance Testing</h2>
        
        <div className="flex space-x-4 mb-6">
          <Button 
            onClick={runTest} 
            disabled={isRunningTest}
            variant="default"
          >
            {isRunningTest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : 'Run Performance Test'}
          </Button>
          
          <div className="flex items-center space-x-2">
            <span>Test with:</span>
            <select 
              value={eventCount}
              onChange={(e) => {
                const count = parseInt(e.target.value);
                setEventCount(count);
                generateEvents(count);
              }}
              className="border rounded p-1"
            >
              <option value="10">10 events</option>
              <option value="50">50 events</option>
              <option value="100">100 events</option>
              <option value="200">200 events</option>
              <option value="500">500 events</option>
              <option value="1000">1000 events</option>
            </select>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Test Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Event Count</th>
                    <th className="border p-2">Avg Render Time (ms)</th>
                    <th className="border p-2">Median Render Time (ms)</th>
                    <th className="border p-2">Min Render Time (ms)</th>
                    <th className="border p-2">Max Render Time (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border p-2">{result.eventCount}</td>
                      <td className="border p-2">{result.averageRenderTime.toFixed(2)}</td>
                      <td className="border p-2">{result.medianRenderTime.toFixed(2)}</td>
                      <td className="border p-2">{result.minRenderTime.toFixed(2)}</td>
                      <td className="border p-2">{result.maxRenderTime.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {analysis && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Performance Analysis</h3>
            <div className="p-4 border rounded bg-gray-50">
              <p className="mb-2"><strong>Summary:</strong> {analysis.summary}</p>
              <p className="mb-2">
                <strong>Scalability:</strong>{' '}
                <span className={
                  analysis.scalability === 'good' ? 'text-green-600' :
                  analysis.scalability === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                }>
                  {analysis.scalability}
                </span>
              </p>
              {analysis.recommendations.length > 0 && (
                <>
                  <p className="font-semibold mt-4">Recommendations:</p>
                  <ul className="list-disc pl-5">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </Card>
      
      <Card className="p-4">
        <h3 className="text-xl font-semibold mb-4">Calendar Preview ({testEvents.length} events)</h3>
        <div className="h-[600px]">
          {testEvents.length > 0 ? (
            <FullCalendarView
              clinicianId="test-clinician"
              userTimeZone="America/Chicago"
              view="timeGridWeek"
              height="550px"
              showAvailability={false}
              onAvailabilityClick={() => {}}
              testEvents={testEvents}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>No test events to display</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CalendarPerformanceTest;