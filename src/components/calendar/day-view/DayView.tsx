
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateToTime12Hour } from '@/utils/timeZoneUtils';
import { DayViewProps } from './types';
import { useDayViewData } from './useDayViewData';
import { 
  generateTimeSlots, 
  isTimeSlotAvailable, 
  getBlockForTimeSlot,
  getAppointmentForTimeSlot,
  isStartOfBlock,
  isEndOfBlock,
  isStartOfAppointment
} from './utils';
import TimeSlot from './TimeSlot';

const DayView: React.FC<DayViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  const {
    loading,
    timeBlocks,
    availabilityBlocks,
    appointmentBlocks,
    getAvailabilityForBlock
  } = useDayViewData({
    currentDate,
    clinicianId,
    refreshTrigger,
    appointments,
    getClientName
  });

  const timeSlots = generateTimeSlots(currentDate);

  const handleAvailabilityBlockClick = (block: any) => {
    if (!onAvailabilityClick || !block.availabilityIds.length) return;
    
    const availabilityId = block.availabilityIds[0];
    const availabilityBlock = getAvailabilityForBlock(availabilityId);
    
    if (availabilityBlock) {
      onAvailabilityClick(currentDate, availabilityBlock);
    }
  };

  const handleAppointmentClick = (appointmentId: string) => {
    if (!onAppointmentClick) return;
    
    const originalAppointment = appointments.find(app => app.id === appointmentId);
    if (originalAppointment) {
      onAppointmentClick(originalAppointment);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-2">
        {timeSlots.map((timeSlot) => {
          const isAvailable = isTimeSlotAvailable(timeSlot, timeBlocks);
          const currentBlock = getBlockForTimeSlot(timeSlot, timeBlocks);
          const appointment = getAppointmentForTimeSlot(timeSlot, appointmentBlocks);
          
          const blockStartCheck = isStartOfBlock(timeSlot, currentBlock);
          const blockEndCheck = isEndOfBlock(timeSlot, currentBlock);
          const appointmentStartCheck = isStartOfAppointment(timeSlot, appointment);

          return (
            <div
              key={timeSlot.toString()}
              className="flex p-2 min-h-[60px] group border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="w-20 text-sm text-gray-500 font-medium">
                {formatDateToTime12Hour(timeSlot)}
              </div>

              <TimeSlot
                timeSlot={timeSlot}
                isAvailable={isAvailable}
                currentBlock={currentBlock}
                appointment={appointment}
                isStartOfBlock={blockStartCheck}
                isEndOfBlock={blockEndCheck}
                isStartOfAppointment={appointmentStartCheck}
                handleAvailabilityBlockClick={handleAvailabilityBlockClick}
                onAppointmentClick={handleAppointmentClick}
                originalAppointments={appointments}
                formatDateToTime12Hour={formatDateToTime12Hour}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DayView;
