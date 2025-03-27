
import React from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Appointment } from '@/types/appointment';

export interface WeekViewProps {
  clinicianId?: string | null;
  currentDate?: Date;
}

const WeekView: React.FC<WeekViewProps> = ({ clinicianId, currentDate = new Date() }) => {
  // Sample appointments data - in a real app, this would come from your database
  const sampleAppointments: Appointment[] = [
    {
      id: '1',
      title: 'Initial Assessment',
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 9, 0),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0),
      clientName: 'John Doe',
      clinicianName: 'Dr. Smith',
      status: 'confirmed',
      color: '#4CAF50'
    },
    {
      id: '2',
      title: 'Therapy Session',
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 14, 0),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 15, 0),
      clientName: 'Jane Smith',
      clinicianName: 'Dr. Johnson',
      status: 'confirmed',
      color: '#2196F3'
    }
  ];
  
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  // Create array of days in the week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(startDate, i));
  }
  
  // Hours for the week view (9 AM to 5 PM)
  const hours = Array.from({ length: 9 }, (_, i) => i + 9);
  
  // Find appointments for a specific day and hour
  const getAppointmentsForTimeSlot = (day: Date, hour: number) => {
    return sampleAppointments.filter(app => 
      isSameDay(app.start, day) && app.start.getHours() === hour
    );
  };
  
  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[800px]">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="h-12"></div> {/* Empty cell for time column */}
          {weekDays.map((day, index) => (
            <div key={index} className="h-12 text-center">
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
            </div>
          ))}
        </div>
        
        {/* Time slots */}
        <div className="grid grid-cols-8 gap-1">
          {/* Time labels column */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="h-20 flex items-start justify-end pr-2 text-sm text-gray-500">
                {hour % 12 === 0 ? '12' : hour % 12}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>
          
          {/* Days columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-1">
              {hours.map(hour => {
                const appointments = getAppointmentsForTimeSlot(day, hour);
                
                return (
                  <div key={hour} className="h-20 bg-gray-50 rounded-md relative">
                    {appointments.map(app => (
                      <Card 
                        key={app.id}
                        className="absolute inset-0 m-1 p-2 overflow-hidden text-xs cursor-pointer"
                        style={{ backgroundColor: app.color || '#2196F3', color: 'white' }}
                      >
                        <div className="font-medium">{app.title}</div>
                        <div>{app.clientName}</div>
                        <div>{format(app.start, 'h:mm a')} - {format(app.end, 'h:mm a')}</div>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {clinicianId && (
        <div className="mt-4 text-sm text-gray-500">
          Showing appointments for clinician ID: {clinicianId}
        </div>
      )}
    </div>
  );
};

export default WeekView;
