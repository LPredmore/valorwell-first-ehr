
import React from 'react';
import { format, addHours, startOfDay } from 'date-fns';

interface TimeColumnProps {
  hours: number[];
  hourHeight: number;
}

const TimeColumn: React.FC<TimeColumnProps> = ({ hours, hourHeight }) => {
  return (
    <div className="col-span-1 border-r border-gray-200 relative pr-2">
      <div className="h-14 border-b border-gray-200"></div>
      {hours.map((hour) => (
        <div 
          key={hour} 
          className="relative"
          style={{ height: `${hourHeight}px` }}
        >
          <span className="absolute -top-2.5 right-2 text-xs text-gray-500">
            {format(addHours(startOfDay(new Date()), hour), 'h a')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TimeColumn;
