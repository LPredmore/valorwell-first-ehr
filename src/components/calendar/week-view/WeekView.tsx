
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useWeekViewData } from './useWeekViewData';
import TimeSlot from './TimeSlot';
import { TimeBlock, AppointmentBlock } from './types';
import { cn } from '@/lib/utils';
import { TimeZoneService } from '@/utils/timeZoneService'; 
import { toast } from '@/components/ui/use-toast';
import { Appointment } from '@/types/appointment';

interface WeekViewProps {
  clinicianId: string | null;
  currentDate: Date;
  showAvailability?: boolean;
  refreshTrigger?: number;
  userTimeZone: string;
  appointments?: Appointment[];
  isLoading?: boolean;
  error?: any;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: any) => void;
}

const WEEKDAY_FORMAT = 'EEE';
const DAY_FORMAT = 'dd';
const TIME_SLOTS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return new Date(0, 0, 0, hour, minute);
});

const WeekView: React.FC<WeekViewProps> = ({
  clinicianId,
  currentDate,
  showAvailability = true,
  refreshTrigger = 0,
  userTimeZone,
  appointments = [],
  isLoading = false,
  error = null,
  onAppointmentClick,
  onAvailabilityClick
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Generate days of the week from the current date
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay() + i); // Start from Sunday
    return date;
  });

  // Log weekView initialization with key parameters
  console.log('[WeekView] Initializing with:', {
    currentDate: currentDate.toISOString(),
    showAvailability,
    clinicianId,
    userTimeZone,
    daysRange: `${days[0].toISOString()} to ${days[6].toISOString()}`
  });

  // Get all the availability and appointment data for these days
  const {
    loading: dataLoading,
    timeBlocks,
    appointmentBlocks,
    weeklyPattern,
    isTimeSlotAvailable,
    getBlockForTimeSlot,
    getAppointmentForTimeSlot,
  } = useWeekViewData(
    days,
    clinicianId,
    refreshTrigger,
    appointments,
    (id) => `Client ${id}`,
    userTimeZone
  );

  // Log the number of time blocks received
  console.log('[WeekView] Received timeBlocks:', {
    count: timeBlocks.length,
    sampleBlock: timeBlocks.length > 0 ? 
      {
        start: timeBlocks[0].start.toISO(),
        end: timeBlocks[0].end.toISO(),
        day: timeBlocks[0].day?.toISO()
      } : null
  });

  const handleAvailabilityBlockClick = (day: Date, block: TimeBlock) => {
    // Functionality for when an availability block is clicked
    console.log('Block clicked:', {
      day: format(day, 'yyyy-MM-dd'),
      start: block.start.toFormat('HH:mm'),
      end: block.end.toFormat('HH:mm')
    });
    
    toast({
      title: "Availability Block",
      description: `${block.start.toFormat('h:mm a')} - ${block.end.toFormat('h:mm a')}`,
    });

    // Call the parent handler if provided
    if (onAvailabilityClick) {
      onAvailabilityClick(day, block);
    }
  };

  // Updated to implement adapter pattern for appointment clicks
  const handleAppointmentClick = (appointmentBlock: AppointmentBlock) => {
    // Functionality for when an appointment is clicked
    console.log('Appointment clicked:', {
      id: appointmentBlock.id,
      client: appointmentBlock.clientName,
      start: appointmentBlock.start.toFormat('HH:mm')
    });
    
    toast({
      title: "Appointment",
      description: `${appointmentBlock.clientName} - ${appointmentBlock.start.toFormat('h:mm a')} - ${appointmentBlock.end.toFormat('h:mm a')}`,
    });
    
    // Find the original appointment object to pass to parent handler
    if (onAppointmentClick) {
      const originalAppointment = appointments.find(a => a.id === appointmentBlock.id);
      if (originalAppointment) {
        onAppointmentClick(originalAppointment);
      }
    }
  };

  if (isLoading || dataLoading) {
    return <div className="flex items-center justify-center h-full py-12">Loading calendar data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading calendar: {error.message}</div>;
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Debug info - can be removed in production */}
      {weeklyPattern && (
        <div className="text-xs bg-gray-100 p-2 mb-2 rounded">
          <p>Weekly Pattern: {Object.entries(weeklyPattern).filter(([_, day]) => day.isAvailable).map(([day]) => day).join(', ')}</p>
        </div>
      )}
      
      {/* Calendar Header */}
      <div className="grid grid-cols-8 bg-white border-b">
        <div className="border-r py-2 px-4 text-gray-500 text-sm">Time</div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "text-center py-2 border-r last:border-r-0",
              {
                "bg-blue-50": selectedDay && 
                  selectedDay.getDate() === day.getDate() && 
                  selectedDay.getMonth() === day.getMonth() && 
                  selectedDay.getFullYear() === day.getFullYear()
              }
            )}
            onClick={() => setSelectedDay(day)}
          >
            <div className="font-medium">{format(day, WEEKDAY_FORMAT)}</div>
            <div className="text-2xl">{format(day, DAY_FORMAT)}</div>
          </div>
        ))}
      </div>

      {/* Calendar Time Grid */}
      <div className="grid grid-cols-8 flex-grow overflow-y-auto">
        {/* Time Labels Column */}
        <div className="border-r">
          {TIME_SLOTS.map((timeSlot, i) => (
            <div
              key={i}
              className={cn(
                "py-2 px-2 text-xs text-gray-500 h-12 border-b",
                { "border-dashed": i % 2 !== 0 }
              )}
            >
              {i % 2 === 0 && format(timeSlot, 'h:mm a')}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        {days.map((day) => (
          <div key={day.toISOString()} className="border-r last:border-r-0">
            {TIME_SLOTS.map((timeSlot, i) => {
              // DEBUG: Log current iteration info for specific time slots
              const formattedDay = format(day, 'yyyy-MM-dd');
              const slotHour = timeSlot.getHours();
              if (formattedDay === '2025-05-15' && (slotHour >= 8 && slotHour <= 18)) {
                console.log('[WeekView] Current Day Loop:', day.toISOString(), 'Time Slot Loop:', timeSlot.toISOString(), 'showAvailability Prop:', showAvailability);
              }
              
              // Check if this slot is within an availability block
              const isAvailable = showAvailability && isTimeSlotAvailable(day, timeSlot);
              
              // Get the full block if available
              const currentBlock = isAvailable ? getBlockForTimeSlot(day, timeSlot) : undefined;
              
              // DEBUG: Log when we find an available time slot
              if (isAvailable) { 
                console.log('[WeekView] For Slot:', timeSlot.toISOString(), 'isAvailable is TRUE. currentBlock:', 
                  currentBlock ? JSON.stringify({
                    start: currentBlock.start.toISO(), 
                    end: currentBlock.end.toISO()
                  }) : 'undefined'); 
              }
              
              // Get appointment if any
              const appointment = getAppointmentForTimeSlot(day, timeSlot);
              
              // Determine if this is the start or end of a block
              const isStartOfBlock = currentBlock && 
                TimeZoneService.fromJSDate(timeSlot).toFormat('HH:mm') === 
                currentBlock.start.toFormat('HH:mm');
              
              const isEndOfBlock = currentBlock && 
                TimeZoneService.fromJSDate(timeSlot).plus({ minutes: 30 }).toFormat('HH:mm') === 
                currentBlock.end.toFormat('HH:mm');
              
              const isStartOfAppointment = appointment && 
                TimeZoneService.fromJSDate(timeSlot).toFormat('HH:mm') === 
                appointment.start.toFormat('HH:mm');
              
              return (
                <TimeSlot
                  key={i}
                  day={day}
                  timeSlot={timeSlot}
                  isAvailable={isAvailable}
                  currentBlock={currentBlock}
                  appointment={appointment}
                  isStartOfBlock={isStartOfBlock}
                  isEndOfBlock={isEndOfBlock}
                  isStartOfAppointment={isStartOfAppointment}
                  handleAvailabilityBlockClick={handleAvailabilityBlockClick}
                  onAppointmentClick={handleAppointmentClick}
                  originalAppointments={appointments}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
