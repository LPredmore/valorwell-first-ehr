
import React from 'react';
import { Loader2 } from 'lucide-react';

const CalendarLoading: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <div className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading calendar information...</p>
        </div>
      </div>
    </div>
  );
};

export default CalendarLoading;
