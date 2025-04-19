
import React from 'react';
import { format, isToday } from 'date-fns';

interface WeekHeaderProps {
  days: Date[];
}

const WeekHeader: React.FC<WeekHeaderProps> = ({ days }) => {
  return (
    <div className="grid grid-cols-8 gap-1">
      {/* Time column header */}
      <div className="h-14 p-1 text-center">
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          Time
        </div>
      </div>
      
      {/* Day column headers */}
      {days.map((day, index) => {
        const isCurrentDay = isToday(day);
        
        return (
          <div 
            key={index} 
            className={`h-14 p-1 text-center ${isCurrentDay ? 'bg-blue-50 rounded-t-md' : ''}`}
          >
            <div className="flex flex-col h-full justify-center items-center">
              <div className="text-sm font-medium">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${isCurrentDay ? 'text-blue-600' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekHeader;
