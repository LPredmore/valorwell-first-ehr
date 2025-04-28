/**
 * React Performance Monitoring Utility
 * 
 * This utility provides tools to monitor and analyze React component performance.
 * It tracks component render times, counts re-renders, and helps identify
 * performance bottlenecks in React applications.
 */

import React from 'react';

// Configuration for React performance monitoring
export interface ReactPerformanceConfig {
  slowRenderThreshold: number;  // Time in ms to consider a render "slow"
  enabled: boolean;             // Whether monitoring is enabled
  logToConsole: boolean;        // Whether to log to console
  sampleRate: number;           // Percentage of renders to sample (0-100)
  maxLogSize: number;           // Maximum number of render logs to keep
}

// Default configuration
const DEFAULT_CONFIG: ReactPerformanceConfig = {
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
 * ReactPerformanceMonitor class for tracking and analyzing React component performance
 */
export class ReactPerformanceMonitor {
  private static instance: ReactPerformanceMonitor;
  private config: ReactPerformanceConfig;
  private renderLog: RenderLogEntry[] = [];
  private componentStats: Record<string, ComponentRenderStats> = {};
  private totalRenders: number = 0;
  private slowRenders: number = 0;
  private totalRenderTime: number = 0;
  private maxRenderTime: number = 0;

  private constructor(config: Partial<ReactPerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[ReactPerformanceMonitor] Initialized with config:', this.config);
  }

  /**
   * Get the singleton instance of ReactPerformanceMonitor
   */
  public static getInstance(config?: Partial<ReactPerformanceConfig>): ReactPerformanceMonitor {
    if (!ReactPerformanceMonitor.instance) {
      ReactPerformanceMonitor.instance = new ReactPerformanceMonitor(config);
    } else if (config) {
      // Update config if provided
      ReactPerformanceMonitor.instance.updateConfig(config);
    }
    return ReactPerformanceMonitor.instance;
  }

  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<ReactPerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[ReactPerformanceMonitor] Updated config:', this.config);
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
      console.warn(`[ReactPerformanceMonitor] SLOW RENDER (${renderTime.toFixed(2)}ms): ${componentName}`, {
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
      recommendations.push('Use React.memo for components that render frequently but with the same props');
      recommendations.push('Implement useMemo for expensive calculations within components');
      recommendations.push('Consider using useCallback for event handlers passed as props');
      
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

    console.log('[ReactPerformanceMonitor] Statistics and logs reset');
  }
}

// Export singleton instance
export const reactPerformanceMonitor = ReactPerformanceMonitor.getInstance();

/**
 * Hook to monitor component render performance
 */
export function useRenderMonitor(componentName: string, options: {
  props?: Record<string, any>;
  enabled?: boolean;
} = {}) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(0);
  const renderStartTime = React.useRef(0);
  const enabled = options.enabled !== undefined ? options.enabled : true;

  // Record render start time
  renderStartTime.current = performance.now();

  // Record render completion and duration
  React.useEffect(() => {
    if (!enabled) return;

    renderCount.current++;
    const renderTime = performance.now() - renderStartTime.current;
    lastRenderTime.current = renderTime;

    reactPerformanceMonitor.recordRender(componentName, renderTime, {
      props: options.props
    });
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
}

/**
 * HOC to monitor component render performance
 */
export function withRenderMonitor<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentName?: string;
    includeProps?: boolean;
  } = {}
) {
  const displayName = options.componentName || Component.displayName || Component.name || 'UnknownComponent';

  const MonitoredComponent = (props: P) => {
    useRenderMonitor(displayName, {
      props: options.includeProps ? props : undefined
    });

    return React.createElement(Component, props);
  };

  MonitoredComponent.displayName = `WithRenderMonitor(${displayName})`;
  return MonitoredComponent;
}