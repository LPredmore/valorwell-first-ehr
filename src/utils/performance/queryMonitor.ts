/**
 * Query Performance Monitoring Utility
 * 
 * This utility provides tools to monitor and analyze database query performance.
 * It tracks query execution times, logs slow queries, and provides analytics
 * to help identify performance bottlenecks.
 */

// Configuration for query monitoring
export interface QueryMonitorConfig {
  slowQueryThreshold: number;  // Time in ms to consider a query "slow"
  enabled: boolean;            // Whether monitoring is enabled
  logToConsole: boolean;       // Whether to log to console
  sampleRate: number;          // Percentage of queries to sample (0-100)
  maxLogSize: number;          // Maximum number of query logs to keep
}

// Default configuration
const DEFAULT_CONFIG: QueryMonitorConfig = {
  slowQueryThreshold: 500,     // 500ms threshold for slow queries
  enabled: true,
  logToConsole: true,
  sampleRate: 100,             // Log 100% of queries by default
  maxLogSize: 1000             // Keep last 1000 query logs
};

// Query log entry structure
export interface QueryLogEntry {
  query: string;               // Query identifier (table/operation)
  params?: any;                // Query parameters (if available)
  duration: number;            // Execution time in milliseconds
  timestamp: number;           // When the query was executed
  isSlow: boolean;             // Whether it exceeded the slow query threshold
  cacheHit?: boolean;          // Whether the result came from cache
  source?: string;             // Source of the query (service/component)
}

// Query statistics structure
export interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  maxDuration: number;
  cacheHitRate: number;
  queriesByTable: Record<string, number>;
  slowQueriesByTable: Record<string, number>;
}

/**
 * QueryMonitor class for tracking and analyzing database query performance
 */
export class QueryMonitor {
  private static instance: QueryMonitor;
  private config: QueryMonitorConfig;
  private queryLog: QueryLogEntry[] = [];
  private totalQueries: number = 0;
  private slowQueries: number = 0;
  private cacheHits: number = 0;
  private queriesByTable: Record<string, number> = {};
  private slowQueriesByTable: Record<string, number> = {};
  private totalDuration: number = 0;
  private maxDuration: number = 0;

  private constructor(config: Partial<QueryMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[QueryMonitor] Initialized with config:', this.config);
  }

  /**
   * Get the singleton instance of QueryMonitor
   */
  public static getInstance(config?: Partial<QueryMonitorConfig>): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor(config);
    } else if (config) {
      // Update config if provided
      QueryMonitor.instance.updateConfig(config);
    }
    return QueryMonitor.instance;
  }

  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<QueryMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[QueryMonitor] Updated config:', this.config);
  }

  /**
   * Start timing a query
   * Returns a function to call when the query completes
   */
  public startTimer(
    query: string,
    options: {
      params?: any;
      source?: string;
    } = {}
  ): (result?: { fromCache?: boolean }) => void {
    // Skip if monitoring is disabled or query doesn't meet sample rate
    if (!this.config.enabled || Math.random() * 100 > this.config.sampleRate) {
      return () => {}; // Return no-op function
    }

    const startTime = performance.now();
    
    // Return a function to call when the query completes
    return (result?: { fromCache?: boolean }) => {
      const duration = performance.now() - startTime;
      this.recordQuery(query, duration, {
        params: options.params,
        source: options.source,
        cacheHit: result?.fromCache
      });
    };
  }

  /**
   * Record a query execution
   */
  public recordQuery(
    query: string,
    duration: number,
    options: {
      params?: any;
      source?: string;
      cacheHit?: boolean;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    // Extract table name from query
    const tableName = this.extractTableName(query);
    
    // Update statistics
    this.totalQueries++;
    this.totalDuration += duration;
    this.maxDuration = Math.max(this.maxDuration, duration);
    
    if (options.cacheHit) {
      this.cacheHits++;
    }
    
    // Track queries by table
    this.queriesByTable[tableName] = (this.queriesByTable[tableName] || 0) + 1;
    
    // Check if this is a slow query
    const isSlow = duration > this.config.slowQueryThreshold;
    
    if (isSlow) {
      this.slowQueries++;
      this.slowQueriesByTable[tableName] = (this.slowQueriesByTable[tableName] || 0) + 1;
    }
    
    // Create log entry
    const logEntry: QueryLogEntry = {
      query,
      params: options.params,
      duration,
      timestamp: Date.now(),
      isSlow,
      cacheHit: options.cacheHit,
      source: options.source
    };
    
    // Add to log, maintaining max size
    this.queryLog.push(logEntry);
    if (this.queryLog.length > this.config.maxLogSize) {
      this.queryLog.shift(); // Remove oldest entry
    }
    
    // Log slow queries to console if enabled
    if (isSlow && this.config.logToConsole) {
      console.warn(`[QueryMonitor] SLOW QUERY (${duration.toFixed(2)}ms): ${query}`, {
        params: options.params,
        source: options.source
      });
    }
  }

  /**
   * Get query statistics
   */
  public getStats(): QueryStats {
    const averageDuration = this.totalQueries > 0 ? this.totalDuration / this.totalQueries : 0;
    const cacheHitRate = this.totalQueries > 0 ? (this.cacheHits / this.totalQueries) * 100 : 0;
    
    return {
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      averageDuration,
      maxDuration: this.maxDuration,
      cacheHitRate,
      queriesByTable: { ...this.queriesByTable },
      slowQueriesByTable: { ...this.slowQueriesByTable }
    };
  }

  /**
   * Get recent query logs
   */
  public getLogs(options: {
    limit?: number;
    slowOnly?: boolean;
    table?: string;
    minDuration?: number;
  } = {}): QueryLogEntry[] {
    let logs = [...this.queryLog];
    
    // Filter by slow queries
    if (options.slowOnly) {
      logs = logs.filter(log => log.isSlow);
    }
    
    // Filter by table
    if (options.table) {
      logs = logs.filter(log => this.extractTableName(log.query) === options.table);
    }
    
    // Filter by minimum duration
    if (options.minDuration) {
      logs = logs.filter(log => log.duration >= options.minDuration);
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }
    
    return logs;
  }

  /**
   * Get slow query analysis
   */
  public analyzeSlowQueries(): {
    slowestQueries: QueryLogEntry[];
    problemTables: { table: string; count: number; avgDuration: number }[];
    recommendations: string[];
  } {
    // Get the slowest queries
    const slowestQueries = this.getLogs({
      limit: 10,
      slowOnly: true
    });
    
    // Analyze problem tables
    const problemTables: { table: string; count: number; avgDuration: number }[] = [];
    const tableDurations: Record<string, number[]> = {};
    
    // Collect durations by table
    this.queryLog.forEach(log => {
      const table = this.extractTableName(log.query);
      if (!tableDurations[table]) {
        tableDurations[table] = [];
      }
      tableDurations[table].push(log.duration);
    });
    
    // Calculate average durations and identify problem tables
    Object.entries(tableDurations).forEach(([table, durations]) => {
      if (durations.length > 0) {
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const slowCount = this.slowQueriesByTable[table] || 0;
        
        if (slowCount > 0) {
          problemTables.push({
            table,
            count: slowCount,
            avgDuration
          });
        }
      }
    });
    
    // Sort problem tables by slow query count
    problemTables.sort((a, b) => b.count - a.count);
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (this.slowQueries > 0) {
      // General recommendations
      recommendations.push('Consider adding indexes to frequently queried columns');
      recommendations.push('Review query patterns for N+1 query issues');
      
      // Table-specific recommendations
      problemTables.slice(0, 3).forEach(table => {
        recommendations.push(`Optimize queries on '${table.table}' table (${table.count} slow queries, avg ${table.avgDuration.toFixed(2)}ms)`);
      });
      
      // Cache recommendations
      if (this.cacheHits / this.totalQueries < 0.5) {
        recommendations.push('Increase cache utilization to reduce database load');
      }
    } else {
      recommendations.push('No slow queries detected. Current performance is good.');
    }
    
    return {
      slowestQueries,
      problemTables,
      recommendations
    };
  }

  /**
   * Reset all statistics and logs
   */
  public reset(): void {
    this.queryLog = [];
    this.totalQueries = 0;
    this.slowQueries = 0;
    this.cacheHits = 0;
    this.queriesByTable = {};
    this.slowQueriesByTable = {};
    this.totalDuration = 0;
    this.maxDuration = 0;
    
    console.log('[QueryMonitor] Statistics and logs reset');
  }

  /**
   * Extract table name from a query string
   */
  private extractTableName(query: string): string {
    // Simple extraction based on common patterns
    const tableMatch = query.match(/from\s+['"]?(\w+)['"]?/i) || 
                      query.match(/table\s+['"]?(\w+)['"]?/i) ||
                      query.match(/^(\w+):/);
    
    return tableMatch ? tableMatch[1] : 'unknown';
  }
}

// Export singleton instance
export const queryMonitor = QueryMonitor.getInstance();

/**
 * Decorator for monitoring class methods that perform database queries
 */
export function MonitorQuery(options: {
  name?: string;
  source?: string;
} = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const queryName = options.name || `${target.constructor.name}.${propertyKey}`;
      const source = options.source || target.constructor.name;
      
      const endTimer = queryMonitor.startTimer(queryName, {
        params: args,
        source
      });
      
      const result = originalMethod.apply(this, args);
      
      // Handle both Promise and non-Promise returns
      if (result instanceof Promise) {
        return result.then((value) => {
          endTimer(value);
          return value;
        }).catch((error) => {
          endTimer();
          throw error;
        });
      } else {
        endTimer();
        return result;
      }
    };
    
    return descriptor;
  };
}

/**
 * Utility function to wrap a query function with performance monitoring
 */
export function monitorQuery<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    name?: string;
    source?: string;
  } = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const queryName = options.name || fn.name || 'anonymous';
    const endTimer = queryMonitor.startTimer(queryName, {
      params: args,
      source: options.source
    });
    
    const result = fn(...args);
    
    // Handle both Promise and non-Promise returns
    if (result instanceof Promise) {
      return result.then((value) => {
        endTimer(value);
        return value;
      }).catch((error) => {
        endTimer();
        throw error;
      }) as ReturnType<T>;
    } else {
      endTimer();
      return result as ReturnType<T>;
    }
  }) as T;
}