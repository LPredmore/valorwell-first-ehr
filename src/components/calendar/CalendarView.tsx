
import React from 'react';

type ViewType = 'day' | 'week' | 'month';

interface CalendarViewProps {
  view: ViewType;
  showAvailability: boolean;
  clinicianId: string | null;
}

const CalendarView: React.FC<CalendarViewProps> = ({ view, showAvailability, clinicianId }) => {
  return (
    <div className="h-[600px] bg-white border rounded-md p-4">
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">
          {view.charAt(0).toUpperCase() + view.slice(1)} view will be displayed here.
          {showAvailability && " Showing availability."}
          {clinicianId && ` For clinician ID: ${clinicianId}`}
        </p>
      </div>
    </div>
  );
};

export default CalendarView;
