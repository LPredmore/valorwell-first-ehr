
import React from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addHours, 
  startOfDay,
  isSameDay
} from 'date-fns';
import { Card } from '@/components/ui/card';

interface WeekViewProps {
  currentDate: Date;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate }) => {
  // Generate days for the week
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });
  
  // Generate hours for each day (from 8 AM to 6 PM)
  const hours = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8; // Starting at 8 AM
    return addHours(startOfDay(new Date()), hour);
  });
  
  // Mock appointments (would come from database in real app)
  const appointments = [
    {
      id: 1,
      title: 'Initial Consultation',
      client: 'John Doe',
      start: addHours(startOfDay(days[1]), 10), // Tuesday at 10 AM
      end: addHours(startOfDay(days[1]), 11),   // Tuesday at 11 AM
      type: 'consultation'
    },
    {
      id: 2,
      title: 'Follow-up Session',
      client: 'Jane Smith',
      start: addHours(startOfDay(days[3]), 14), // Thursday at 2 PM
      end: addHours(startOfDay(days[3]), 15),   // Thursday at 3 PM
      type: 'session'
    },
    {
      id: 3,
      title: 'Group Therapy',
      client: 'Support Group',
      start: addHours(startOfDay(days[4]), 16), // Friday at 4 PM
      end: addHours(startOfDay(days[4]), 17),   // Friday at 5 PM
      type: 'group'
    }
  ];
  
  // Function to get appointments for a specific day and hour
  const getAppointmentsForTimeSlot = (day: Date, hourObj: Date) => {
    return appointments.filter(apt => {
      const isSameD = isSameDay(day, apt.start);
      const hourStart = hourObj.getHours();
      const appointmentHour = apt.start.getHours();
      return isSameD && hourStart === appointmentHour;
    });
  };
  
  return (
    <Card className="p-4">
      <div className="grid grid-cols-8 gap-1">
        <div className="col-span-1"></div>
        {days.map(day => (
          <div 
            key={day.toString()} 
            className="col-span-1 p-2 text-center font-medium border-b-2 border-gray-200"
          >
            <div className="text-sm text-gray-400">{format(day, 'EEE')}</div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'bg-valorwell-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
        
        {hours.map(hour => (
          <React.Fragment key={hour.toString()}>
            <div className="col-span-1 p-2 text-xs text-gray-500 text-right pr-4 border-t border-gray-100">
              {format(hour, 'h:mm a')}
            </div>
            
            {days.map(day => {
              const appointments = getAppointmentsForTimeSlot(day, hour);
              
              return (
                <div 
                  key={`${day}-${hour}`} 
                  className="col-span-1 min-h-[60px] border-t border-l border-gray-100 p-1 group hover:bg-gray-50"
                >
                  {appointments.length > 0 ? (
                    appointments.map(appointment => (
                      <div 
                        key={appointment.id}
                        className="p-1 bg-valorwell-100 border-l-4 border-valorwell-500 rounded text-xs"
                      >
                        <div className="font-medium truncate">{appointment.title}</div>
                        <div className="text-[10px] text-gray-600 truncate">
                          {appointment.client}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-gray-400">
                      +
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

export default WeekView;
