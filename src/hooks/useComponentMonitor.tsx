import { useRef, useEffect } from 'react';
import { componentMonitor } from '@/utils/performance/componentMonitor';

/**
 * Hook to monitor React component render performance
 * 
 * @param componentName Name of the component to monitor
 * @param options Configuration options
 * @returns Object containing render count and last render time
 */
export function useComponentMonitor(
  componentName: string, 
  options: {
    props?: Record<string, any>;
    enabled?: boolean;
  } = {}
) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const renderStartTime = useRef(0);
  const enabled = options.enabled !== undefined ? options.enabled : true;

  // Record render start time
  renderStartTime.current = performance.now();

  // Record render completion and duration
  useEffect(() => {
    if (!enabled) return;

    renderCount.current++;
    const renderTime = performance.now() - renderStartTime.current;
    lastRenderTime.current = renderTime;

    componentMonitor.recordRender(componentName, renderTime, {
      props: options.props
    });
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
}

/**
 * Higher-order component to monitor component render performance
 * 
 * @param Component The component to monitor
 * @param options Configuration options
 * @returns A monitored version of the component
 */
export function withComponentMonitor<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentName?: string;
    includeProps?: boolean;
  } = {}
) {
  const displayName = options.componentName || 
                      Component.displayName || 
                      Component.name || 
                      'UnknownComponent';

  const MonitoredComponent = (props: P) => {
    useComponentMonitor(displayName, {
      props: options.includeProps ? props : undefined
    });

    return <Component {...props} />;
  };

  MonitoredComponent.displayName = `WithComponentMonitor(${displayName})`;
  return MonitoredComponent;
}