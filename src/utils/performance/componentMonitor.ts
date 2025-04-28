/**
 * Component Performance Monitoring Utility
 * 
 * This utility provides tools to monitor and analyze component performance.
 * It tracks component render times, counts re-renders, and helps identify
 * performance bottlenecks in applications.
 */

// Configuration for component monitoring
export interface ComponentMonitorConfig {
  slowRenderThreshold: number;  // Time in ms to consider a render "slow"
  enabled: boolean;             // Whether monitoring is enabled
  logToConsole: boolean;        // Whether to log to console
  sampleRate: number;           // Percentage of renders to sample (0-100)
  maxLogSize: number;           // Maximum number of render logs to keep
}

// Default configuration
const DEFAULT_CONFIG: ComponentMonitorConfig = {
  slowRenderThreshold: 16,      // 16ms threshold (60fps target)
  enabled: true,
  logToConsole: true,
  sampleRate: 100,              // Log 100% of renders by default
  maxLogSize: 1000              // Keep last 1000 render logs
};

// Render log entry structure
export interface RenderLogEntry {
  componentName: string;        // Name of the component
  renderTime: number;           // Render time in milliseconds
  timestamp: number;            // When the render occurred
  isSlow: boolean;              // Whether it exceeded the slow render threshold
  renderCount: number;          // How many times this component has rendered
  props?: Record<string, any>;  // Component props (if available)
}

// Component render statistics
export interface ComponentRenderStats {
  totalRenders: number;
  slowRenders: number;
  averageRenderTime: number;
  maxRenderTime: number;
  lastRenderTime: number;
}

/**
 * ComponentMonitor class for tracking and analyzing component performance
 */
export class ComponentMonitor {
  private static instance: ComponentMonitor;
  private config: ComponentMonitorConfig;
  private renderLog: RenderLogEntry[] = [];
  private componentStats: Record<string, ComponentRenderStats> = {};
  private totalRenders: number = 0;
  private slowRenders: number = 0;
  private totalRenderTime: number = 0;
  private maxRenderTime: number = 0;

  private constructor(config: Partial<ComponentMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[ComponentMonitor] Initialized with config:', this.config);
  }

  /**
   * Get the singleton instance of ComponentMonitor
   */
  public static getInstance(config?: Partial<ComponentMonitorConfig>): ComponentMonitor {
    if (!ComponentMonitor.instance) {
      ComponentMonitor.instance = new ComponentMonitor(config);
    } else if (config) {
      // Update config if provided
      ComponentMonitor.instance.updateConfig(config);
    }
    return ComponentMonitor.instance;
  }

  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<ComponentMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[ComponentMonitor] Updated config:', this.config);
  }

  /**
   * Start timing a component render
   * Returns a function to call when the render completes
   */
  public startRender(
    componentName: string,
    options: {
      props?: Record<string, any>;
    } = {}
  ): () => void {
    // Skip if monitoring is disabled or component doesn't meet sample rate
    if (!this.config.enabled || Math.random() * 100 > this.config.sampleRate) {
      return () => {}; // Return no-op function
    }

    const startTime = performance.now();
    
    // Return a function to call when the render completes
    return () => {
      const renderTime = performance.now() - startTime;
      this.recordRender(componentName, renderTime, options);
    };
  }

  /**
   * Record a component render
   */
  public recordRender(
    componentName: string,
    renderTime: number,
    options: {
      props?: Record<string, any>;
    } = {}
  ): void {
    if (!this.config.enabled) return;

    // Update global statistics
    this.totalRenders++;
    this.totalRenderTime += renderTime;
    this.maxRenderTime = Math.max(this.maxRenderTime, renderTime);

    // Check if this is a slow render
    const isSlow = renderTime > this.config.slowRenderThreshold;
    if (isSlow) {
      this.slowRenders++;
    }

    // Update component-specific statistics
    if (!this.componentStats[componentName]) {
      this.componentStats[componentName] = {
        totalRenders: 0,
        slowRenders: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        lastRenderTime: 0
      };
    }

    const stats = this.componentStats[componentName];
    stats.totalRenders++;
    stats.lastRenderTime = renderTime;
    stats.maxRenderTime = Math.max(stats.maxRenderTime, renderTime);
    stats.averageRenderTime = 
      (stats.averageRenderTime * (stats.totalRenders - 1) + renderTime) / stats.totalRenders;

    if (isSlow) {
      stats.slowRenders++;
    }

    // Create log entry
    const logEntry: RenderLogEntry = {
      componentName,
      renderTime,
      timestamp: Date.now(),
      isSlow,
      renderCount: stats.totalRenders,
      props: options.props
    };

    // Add to log, maintaining max size
    this.renderLog.push(logEntry);
    if (this.renderLog.length > this.config.maxLogSize) {
      this.renderLog.shift(); // Remove oldest entry
    }

    // Log slow renders to console if enabled
    if (isSlow && this.config.logToConsole) {
      console.warn(`[ComponentMonitor] SLOW RENDER (${renderTime.toFixed(2)}ms): ${componentName}`, {
        renderCount: stats.totalRenders,
        props: options.props
      });
    }
  }

  /**
   * Get overall render statistics
   */
  public getStats(): {
    totalRenders: number;
    slowRenders: number;
    averageRenderTime: number;
    maxRenderTime: number;
    componentStats: Record<string, ComponentRenderStats>;
  } {
    const averageRenderTime = this.totalRenders > 0 ? this.totalRenderTime / this.totalRenders : 0;

    return {
      totalRenders: this.totalRenders,
      slowRenders: this.slowRenders,
      averageRenderTime,
      maxRenderTime: this.maxRenderTime,
      componentStats: { ...this.componentStats }
    };
  }

  /**
   * Get render logs
   */
  public getLogs(options: {
    limit?: number;
    slowOnly?: boolean;
    componentName?: string;
    minRenderTime?: number;
  } = {}): RenderLogEntry[] {
    let logs = [...this.renderLog];

    // Filter by slow renders
    if (options.slowOnly) {
      logs = logs.filter(log => log.isSlow);
    }

    // Filter by component name
    if (options.componentName) {
      logs = logs.filter(log => log.componentName === options.componentName);
    }

    // Filter by minimum render time
    if (options.minRenderTime) {
      logs = logs.filter(log => log.renderTime >= options.minRenderTime);
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
   * Analyze component performance and provide recommendations
   */
  public analyzePerformance(): {
    slowestComponents: { name: string; averageRenderTime: number; renderCount: number }[];
    frequentlyRenderingComponents: { name: string; renderCount: number; averageRenderTime: number }[];
    recommendations: string[];
  } {
    const componentEntries = Object.entries(this.componentStats);

    // Find slowest components
    const slowestComponents = componentEntries
      .map(([name, stats]) => ({
        name,
        averageRenderTime: stats.averageRenderTime,
        renderCount: stats.totalRenders
      }))
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 5);

    // Find most frequently rendering components
    const frequentlyRenderingComponents = componentEntries
      .map(([name, stats]) => ({
        name,
        renderCount: stats.totalRenders,
        averageRenderTime: stats.averageRenderTime
      }))
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, 5);

    // Generate recommendations
    const recommendations: string[] = [];

    if (this.slowRenders > 0) {
      recommendations.push('Use memoization for components that render frequently but with the same props');
      recommendations.push('Implement memoization for expensive calculations within components');
      recommendations.push('Consider using callback memoization for event handlers passed as props');
      
      // Component-specific recommendations
      slowestComponents.slice(0, 3).forEach(component => {
        if (component.averageRenderTime > this.config.slowRenderThreshold * 2) {
          recommendations.push(`Optimize '${component.name}' component (avg ${component.averageRenderTime.toFixed(2)}ms, ${component.renderCount} renders)`);
        }
      });

      frequentlyRenderingComponents.slice(0, 3).forEach(component => {
        if (component.renderCount > 10 && component.averageRenderTime > this.config.slowRenderThreshold / 2) {
          recommendations.push(`Reduce re-renders for '${component.name}' (${component.renderCount} renders, avg ${component.averageRenderTime.toFixed(2)}ms)`);
        }
      });
    } else {
      recommendations.push('No slow renders detected. Current performance is good.');
    }

    return {
      slowestComponents,
      frequentlyRenderingComponents,
      recommendations
    };
  }

  /**
   * Reset all statistics and logs
   */
  public reset(): void {
    this.renderLog = [];
    this.componentStats = {};
    this.totalRenders = 0;
    this.slowRenders = 0;
    this.totalRenderTime = 0;
    this.maxRenderTime = 0;
    
    console.log('[ComponentMonitor] Statistics and logs reset');
  }
}

// Export singleton instance
export const componentMonitor = ComponentMonitor.getInstance();

/**
 * Helper function to create a monitored version of a function
 */
export function monitorFunction<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    name?: string;
    includeArgs?: boolean;
  } = {}
): T {
  const name = options.name || fn.name || 'anonymous';
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const endTimer = componentMonitor.startRender(name, {
      props: options.includeArgs ? args : undefined
    });
    
    try {
      const result = fn(...args);
      
      // Handle both Promise and non-Promise returns
      if (result instanceof Promise) {
        return result.finally(endTimer) as ReturnType<T>;
      } else {
        endTimer();
        return result as ReturnType<T>;
      }
    } catch (error) {
      endTimer();
      throw error;
    }
  }) as T;
}