
// Simple placeholder for web-vitals until we can install the actual package
// This prevents build errors while still allowing the app to function

interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  delta?: number;
}

type ReportHandler = (metric: WebVitalMetric) => void;

// Stub implementation for reportWebVitals
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    console.log('Web vitals reporting disabled: web-vitals package not installed');
    // In a real implementation, we would dynamically import web-vitals here
  }
};

export default reportWebVitals;
