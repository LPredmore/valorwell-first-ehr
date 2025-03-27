
import React from 'react';

interface WeekViewProps {
  currentDate: Date;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate }) => {
  // Generate list of days in the current week
  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDays.push(nextDay);
    }
    return weekDays;
  };
  
  const weekDays = getWeekDays(new Date(currentDate));
  
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-8 gap-1 min-w-[800px]">
        {/* Time column */}
        <div className="col-span-1">
          <div className="h-10 border-b"></div>
          {timeSlots.map((time, index) => (
            <div key={`time-${index}`} className="h-16 flex items-center justify-end pr-2 text-sm text-gray-500">
              {time}
            </div>
          ))}
        </div>
        
        {/* Days of the week */}
        {weekDays.map((day, dayIndex) => (
          <div key={`day-${dayIndex}`} className="col-span-1">
            <div className="h-10 border-b flex items-center justify-center font-medium">
              {formatDate(day)}
            </div>
            {timeSlots.map((_, timeIndex) => {
              const isAvailable = Math.random() > 0.7; // Random availability for demo
              return (
                <div 
                  key={`slot-${dayIndex}-${timeIndex}`} 
                  className={`h-16 border border-gray-100 m-0.5 rounded cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm 
                    ${isAvailable ? 'bg-green-50 hover:bg-green-100' : ''}`}
                >
                  {isAvailable && <span className="text-green-600">Available</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
