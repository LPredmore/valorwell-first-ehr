
import React from 'react';
import { format } from 'date-fns';

interface TimeColumnProps {
  hours: number[];
  hourHeight: number;
}

const TimeColumn: React.FC<TimeColumnProps> = ({ hours, hourHeight }) => {
  return (
    <div className="col-span-1 border-r border-gray-200 relative">
      <div className="h-14 border-b border-gray-200"></div>
      
      {hours.map((hour, index) => {
        // Format hour as AM/PM
        const formattedHour = format(new Date().setHours(hour, 0, 0, 0), 'h a');
        
        return (
          <div 
            key={hour} 
            className="w-full border-b border-gray-200 relative" 
            style={{ height: `${hourHeight}px` }}
          >
            <div className="absolute -top-3 -left-1 text-xs text-gray-500 font-medium px-2">
              {formattedHour}
            </div>
            {/* Half-hour divider */}
            <div className="w-full h-1/2 border-b border-gray-100"></div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeColumn;
