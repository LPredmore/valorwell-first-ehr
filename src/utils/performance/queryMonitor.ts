
interface TimerOptions {
  source?: string;
  params?: Record<string, any>;
}

interface TimerResult {
  fromCache?: boolean;
  duration?: number;
  result?: any;
}

/**
 * Simple query performance monitoring utility
 */
export const queryMonitor = {
  /**
   * Start a timer for a query or operation
   */
  startTimer: (operation: string, options: TimerOptions = {}) => {
    const startTime = performance.now();
    const { source, params } = options;
    
    console.log(`[QueryMonitor] Started: ${operation}`, {
      source,
      params,
      timestamp: new Date().toISOString()
    });
    
    return (result: TimerResult = {}) => {
      const duration = performance.now() - startTime;
      const { fromCache } = result;
      
      console.log(`[QueryMonitor] Completed: ${operation} in ${duration.toFixed(2)}ms`, {
        duration,
        fromCache,
        source,
        params,
        timestamp: new Date().toISOString()
      });
      
      return duration;
    };
  },
  
  /**
   * Measure the performance of an async function
   */
  measure: async <T>(name: string, fn: () => Promise<T>, options: TimerOptions = {}): Promise<T> => {
    const endTimer = queryMonitor.startTimer(name, options);
    try {
      const result = await fn();
      endTimer({ result });
      return result;
    } catch (error) {
      endTimer({ result: error });
      throw error;
    }
  }
};

export default queryMonitor;
