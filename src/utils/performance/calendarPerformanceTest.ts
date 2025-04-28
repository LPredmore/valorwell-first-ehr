/**
 * Calendar Performance Testing Utility
 * 
 * This utility provides tools to test and analyze the performance of calendar components.
 * It generates test data, measures rendering performance, and provides insights for optimization.
 */

import { componentMonitor } from './componentMonitor';
import { CalendarEvent } from '@/types/calendar';

/**
 * Configuration for calendar performance tests
 */
export interface CalendarPerformanceTestConfig {
  eventCounts: number[];        // Array of event counts to test (e.g., [10, 100, 1000])
  iterations: number;           // Number of test iterations for each event count
  includeRecurring: boolean;    // Whether to include recurring events
  includeLongEvents: boolean;   // Whether to include multi-day events
  logResults: boolean;          // Whether to log results to console
}

/**
 * Default test configuration
 */
const DEFAULT_TEST_CONFIG: CalendarPerformanceTestConfig = {
  eventCounts: [10, 50, 100, 500, 1000],
  iterations: 3,
  includeRecurring: true,
  includeLongEvents: true,
  logResults: true
};

/**
 * Test result structure
 */
export interface TestResult {
  eventCount: number;
  averageRenderTime: number;
  medianRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  totalMemoryUsage?: number;    // In MB, if available
}

/**
 * Generate a random date within the specified range
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate test calendar events
 */
export function generateTestEvents(
  count: number,
  options: {
    startDate?: Date;
    endDate?: Date;
    includeRecurring?: boolean;
    includeLongEvents?: boolean;
  } = {}
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const startDate = options.startDate || new Date();
  const endDate = options.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start
  const includeRecurring = options.includeRecurring !== undefined ? options.includeRecurring : true;
  const includeLongEvents = options.includeLongEvents !== undefined ? options.includeLongEvents : true;
  
  // Event types for variety
  const eventTypes = ['appointment', 'availability', 'blocked'];
  const statusTypes = ['confirmed', 'pending', 'cancelled'];
  
  for (let i = 0; i < count; i++) {
    // Determine if this is a recurring event
    const isRecurring = includeRecurring && Math.random() < 0.3; // 30% chance of recurring
    
    // Determine if this is a long event
    const isLongEvent = includeLongEvents && Math.random() < 0.2; // 20% chance of long event
    
    // Generate random start date within range
    const eventStart = randomDate(startDate, endDate);
    
    // Generate random duration
    let durationHours = isLongEvent 
      ? Math.floor(Math.random() * 72) + 24 // 1-3 days for long events
      : Math.floor(Math.random() * 3) + 1;  // 1-3 hours for regular events
    
    // Create end date
    const eventEnd = new Date(eventStart.getTime() + durationHours * 60 * 60 * 1000);
    
    // Select random event type and status
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = statusTypes[Math.floor(Math.random() * statusTypes.length)];
    
    // Create event
    const event: CalendarEvent = {
      id: `test-event-${i}`,
      title: `Test Event ${i}`,
      start: eventStart,
      end: eventEnd,
      extendedProps: {
        eventType,
        status,
        isRecurring,
        sourceInfo: 'test-data'
      }
    };
    
    // Add styling based on event type
    if (eventType === 'availability') {
      event.backgroundColor = '#4caf50';
      event.borderColor = '#388e3c';
      event.classNames = ['availability-event'];
    } else if (eventType === 'blocked') {
      event.backgroundColor = '#f44336';
      event.borderColor = '#d32f2f';
      event.classNames = ['blocked-event'];
    } else {
      event.backgroundColor = '#2196f3';
      event.borderColor = '#1976d2';
      event.classNames = ['appointment-event'];
    }
    
    // Add to events array
    events.push(event);
  }
  
  return events;
}

/**
 * Run a performance test on a calendar component
 */
export async function runCalendarPerformanceTest(
  renderComponent: (events: CalendarEvent[]) => Promise<number>,
  config: Partial<CalendarPerformanceTestConfig> = {}
): Promise<TestResult[]> {
  const testConfig = { ...DEFAULT_TEST_CONFIG, ...config };
  const results: TestResult[] = [];
  
  // Reset component monitor before tests
  componentMonitor.reset();
  
  // Run tests for each event count
  for (const eventCount of testConfig.eventCounts) {
    const renderTimes: number[] = [];
    
    // Generate test events
    const testEvents = generateTestEvents(eventCount, {
      includeRecurring: testConfig.includeRecurring,
      includeLongEvents: testConfig.includeLongEvents
    });
    
    // Run multiple iterations
    for (let i = 0; i < testConfig.iterations; i++) {
      // Measure render time
      const renderTime = await renderComponent(testEvents);
      renderTimes.push(renderTime);
      
      // Wait for GC between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Sort render times for median calculation
    renderTimes.sort((a, b) => a - b);
    
    // Calculate statistics
    const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    const medianRenderTime = renderTimes[Math.floor(renderTimes.length / 2)];
    const minRenderTime = renderTimes[0];
    const maxRenderTime = renderTimes[renderTimes.length - 1];
    
    // Create result
    const result: TestResult = {
      eventCount,
      averageRenderTime,
      medianRenderTime,
      minRenderTime,
      maxRenderTime
    };
    
    // Add to results
    results.push(result);
    
    // Log results if enabled
    if (testConfig.logResults) {
      console.log(`Calendar Performance Test (${eventCount} events):`, {
        average: `${averageRenderTime.toFixed(2)}ms`,
        median: `${medianRenderTime.toFixed(2)}ms`,
        min: `${minRenderTime.toFixed(2)}ms`,
        max: `${maxRenderTime.toFixed(2)}ms`
      });
    }
  }
  
  return results;
}

/**
 * Analyze performance test results and provide recommendations
 */
export function analyzePerformanceResults(results: TestResult[]): {
  summary: string;
  recommendations: string[];
  scalability: 'good' | 'moderate' | 'poor';
} {
  // Calculate performance metrics
  const eventCountsToRenderTimes = results.map(r => ({
    eventCount: r.eventCount,
    renderTime: r.averageRenderTime
  }));
  
  // Sort by event count
  eventCountsToRenderTimes.sort((a, b) => a.eventCount - b.eventCount);
  
  // Calculate scaling factor (how much render time increases as event count increases)
  let scalingFactor = 0;
  if (eventCountsToRenderTimes.length >= 2) {
    const first = eventCountsToRenderTimes[0];
    const last = eventCountsToRenderTimes[eventCountsToRenderTimes.length - 1];
    
    // Calculate ratio of render time increase to event count increase
    scalingFactor = (last.renderTime / first.renderTime) / (last.eventCount / first.eventCount);
  }
  
  // Determine scalability rating
  let scalability: 'good' | 'moderate' | 'poor' = 'good';
  if (scalingFactor > 2) {
    scalability = 'poor';
  } else if (scalingFactor > 1) {
    scalability = 'moderate';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (scalability === 'poor') {
    recommendations.push('Implement virtualization to render only visible events');
    recommendations.push('Add windowing techniques to limit the number of rendered DOM elements');
    recommendations.push('Consider pagination or infinite scrolling for large datasets');
  }
  
  if (results.some(r => r.averageRenderTime > 500)) {
    recommendations.push('Optimize event rendering with memoization');
    recommendations.push('Implement lazy loading for calendar events');
    recommendations.push('Consider using a worker thread for data processing');
  }
  
  if (results.some(r => r.maxRenderTime > 1000)) {
    recommendations.push('Add debouncing for frequent state updates');
    recommendations.push('Implement selective re-rendering strategies');
  }
  
  // Generate summary
  const summary = `Calendar performance analysis shows ${scalability} scalability. ` +
    `Render time increases by a factor of ${scalingFactor.toFixed(2)} relative to event count. ` +
    `Maximum render time: ${Math.max(...results.map(r => r.maxRenderTime)).toFixed(2)}ms.`;
  
  return {
    summary,
    recommendations,
    scalability
  };
}

/**
 * Create a test harness for calendar components
 */
export function createCalendarTestHarness(
  renderComponent: (events: CalendarEvent[]) => Promise<number>
) {
  return {
    generateTestEvents,
    runTest: (config?: Partial<CalendarPerformanceTestConfig>) => 
      runCalendarPerformanceTest(renderComponent, config),
    analyzeResults: analyzePerformanceResults
  };
}