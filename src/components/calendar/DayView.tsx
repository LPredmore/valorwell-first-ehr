
import React from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import { Card } from '@/components/ui/card';

interface DayViewProps {
  currentDate: Date;
}

const DayView: React.FC<DayViewProps> = ({ currentDate }) => {
  // Generate hours for the day (from 8 AM to 6 PM)
  const hours = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8; // Starting at 8 AM
    return addHours(startOfDay(currentDate), hour);
  });
  
  // Mock appointments (would come from database in real app)
  const appointments = [
    {
      id: 1,
      title: 'Initial Consultation',
      client: 'John Doe',
      start: addHours(startOfDay(currentDate), 10), // 10 AM
      end: addHours(startOfDay(currentDate), 11),   // 11 AM
      type: 'consultation'
    },
    {
      id: 2,
      title: 'Follow-up Session',
      client: 'Jane Smith',
      start: addHours(startOfDay(currentDate), 14), // 2 PM
      end: addHours(startOfDay(currentDate), 15),   // 3 PM
      type: 'session'
    }
  ];
  
  // Function to check if hour has appointments
  const getAppointmentsForHour = (hour: Date) => {
    return appointments.filter(apt => {
      const hourStart = hour.getHours();
      const appointmentHour = apt.start.getHours();
      return hourStart === appointmentHour;
    });
  };
  
  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-2">
        {hours.map((hour) => {
          const hourAppointments = getAppointmentsForHour(hour);
          
          return (
            <div 
              key={hour.toString()} 
              className="flex p-2 min-h-[80px] group border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="w-20 text-sm text-gray-500 font-medium">
                {format(hour, 'h:mm a')}
              </div>
              
              <div className="flex-1">
                {hourAppointments.length > 0 ? (
                  hourAppointments.map(appointment => (
                    <div 
                      key={appointment.id}
                      className="p-2 bg-valorwell-100 border-l-4 border-valorwell-500 rounded text-sm mb-1"
                    >
                      <div className="font-medium">{appointment.title}</div>
                      <div className="text-xs text-gray-600">
                        {appointment.client} · {format(appointment.start, 'h:mm a')} - {format(appointment.end, 'h:mm a')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-gray-400">
                    Available
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DayView;
