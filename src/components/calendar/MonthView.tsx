
import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate }) => {
  // Get all days in the current month view (including days from prev/next months to fill the calendar grid)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Mock appointments (would come from database in real app)
  const appointments = [
    {
      id: 1,
      title: 'Initial Consultation',
      client: 'John Doe',
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
      type: 'consultation'
    },
    {
      id: 2,
      title: 'Follow-up Session',
      client: 'Jane Smith',
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      type: 'session'
    },
    {
      id: 3,
      title: 'Group Therapy',
      client: 'Support Group',
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
      type: 'group'
    },
    {
      id: 4,
      title: 'Assessment',
      client: 'Mike Johnson',
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
      type: 'assessment'
    }
  ];
  
  // Group appointments by date
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(day, apt.date));
  };
  
  // Create week rows
  const weeks = [];
  let weekDays = [];
  
  for (let i = 0; i < days.length; i++) {
    weekDays.push(days[i]);
    
    if (weekDays.length === 7 || i === days.length - 1) {
      weeks.push(weekDays);
      weekDays = [];
    }
  }
  
  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-1 text-center font-medium mb-2 border-b pb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div 
                key={day.toString()}
                className={cn(
                  "min-h-[100px] p-1 border border-gray-100 hover:bg-gray-50 rounded-md",
                  !isCurrentMonth && "bg-gray-50 opacity-40"
                )}
              >
                <div className={cn(
                  "text-right p-1",
                  isToday(day) && "bg-valorwell-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="mt-1 space-y-1">
                  {dayAppointments.slice(0, 3).map(appointment => (
                    <div 
                      key={appointment.id}
                      className="p-1 bg-valorwell-100 border-l-4 border-valorwell-500 rounded text-xs truncate"
                    >
                      {appointment.title}
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
};

export default MonthView;
