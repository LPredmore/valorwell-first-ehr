
/**
 * QueryMonitor - A utility for monitoring query performance
 */
export const queryMonitor = {
  /**
   * Start timing a query operation
   */
  startTimer(operation: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    const id = Math.random().toString(36).substring(2, 10);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[QueryMonitor] Starting ${operation}`, metadata);
    }
    
    return (additionalMetadata?: Record<string, any>) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[QueryMonitor] ${operation} completed in ${duration.toFixed(2)}ms`, {
          ...metadata,
          ...additionalMetadata,
          duration,
        });
      }
    };
  },

  /**
   * Log query information without timing
   */
  logQuery(operation: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[QueryMonitor] ${operation}`, metadata);
    }
  }
};

export type QueryEndTimer = ReturnType<typeof queryMonitor.startTimer>;
