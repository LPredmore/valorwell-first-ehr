
// Re-export utility types and functions for week view functionality
// This file is maintained for backwards compatibility

export interface WeekViewEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  color?: string;
  editable?: boolean;
  [key: string]: any;
}

export interface WeekViewProps {
  events?: WeekViewEvent[];
  onEventClick?: (event: any) => void;
  onDateSelect?: (info: any) => void;
  height?: string;
  [key: string]: any;
}

// Utility function to convert dates to week view format
export function formatWeekViewDates(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}
