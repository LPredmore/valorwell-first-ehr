
import { format, addMinutes, startOfDay, setHours, setMinutes, differenceInMinutes, parseISO, isSameDay } from 'date-fns';
import { 
  AvailabilityBlock, 
  AvailabilityException, 
  TimeBlock, 
  AppointmentBlock,
  AppointmentData 
} from './types';

// Generate time slots for the day view (6:00 AM to 10:00 PM)
export const generateTimeSlots = (currentDate: Date): Date[] => {
  console.log("[utils] Generating time slots for date:", format(currentDate, 'yyyy-MM-dd'));
  const slots = Array.from({ length: 32 }, (_, i) => {
    const minutes = i * 30;
    return addMinutes(setHours(startOfDay(currentDate), 6), minutes);
  });
  return slots;
};

// Process appointments into appointment blocks
export const processAppointments = (
  appointments: AppointmentData[],
  getClientName: (clientId: string) => string
): AppointmentBlock[] => {
  if (!appointments.length) {
    console.log("[utils] No appointments to process");
    return [];
  }

  console.log("[utils] Processing appointments:", appointments);
  
  const blocks = appointments.map(appointment => {
    const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
    const [endHour, endMinute] = appointment.end_time.split(':').map(Number);

    const dateObj = parseISO(appointment.date);
    const start = setMinutes(setHours(startOfDay(dateObj), startHour), startMinute);
    const end = setMinutes(setHours(startOfDay(dateObj), endHour), endMinute);

    console.log(`[utils] Appointment ${appointment.id} mapped to start: ${format(start, 'yyyy-MM-dd HH:mm')}, end: ${format(end, 'yyyy-MM-dd HH:mm')}`);

    return {
      id: appointment.id,
      start,
      end,
      clientId: appointment.client_id,
      type: appointment.type,
      clientName: getClientName(appointment.client_id)
    };
  });

  return blocks;
};

// Process availability blocks with exceptions
export const processAvailabilityWithExceptions = (
  blocks: AvailabilityBlock[],
  exceptions: AvailabilityException[],
  currentDate: Date
): TimeBlock[] => {
  if (!blocks.length) {
    console.log("[utils] No availability blocks to process");
    return [];
  }

  console.log("[utils] Processing availability blocks:", blocks);
  console.log("[utils] With exceptions:", exceptions);

  const exceptionsMap: Record<string, AvailabilityException> = {};
  exceptions.forEach(exception => {
    exceptionsMap[exception.original_availability_id] = exception;
  });

  const effectiveBlocks = blocks
    .filter(block => {
      const exception = exceptionsMap[block.id];
      return !exception || !exception.is_deleted;
    })
    .map(block => {
      const exception = exceptionsMap[block.id];
      
      if (exception && exception.start_time && exception.end_time) {
        return {
          ...block,
          start_time: exception.start_time,
          end_time: exception.end_time,
          isException: true
        };
      }
      
      return block;
    });

  const parsedBlocks = effectiveBlocks.map(block => {
    const [startHour, startMinute] = block.start_time.split(':').map(Number);
    const [endHour, endMinute] = block.end_time.split(':').map(Number);

    const start = setMinutes(setHours(startOfDay(currentDate), startHour), startMinute);
    const end = setMinutes(setHours(startOfDay(currentDate), endHour), endMinute);

    return {
      id: block.id,
      start,
      end,
      isException: block.isException
    };
  });

  parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

  const mergedBlocks: TimeBlock[] = [];

  parsedBlocks.forEach(block => {
    const lastBlock = mergedBlocks[mergedBlocks.length - 1];

    if (lastBlock && block.start <= lastBlock.end) {
      if (block.end > lastBlock.end) {
        lastBlock.end = block.end;
      }
      lastBlock.availabilityIds.push(block.id);
      if (block.isException) {
        lastBlock.isException = true;
      }
    } else {
      mergedBlocks.push({
        start: block.start,
        end: block.end,
        availabilityIds: [block.id],
        isException: block.isException
      });
    }
  });

  return mergedBlocks;
};

// Helper functions for time slots
export const isTimeSlotAvailable = (timeSlot: Date, timeBlocks: TimeBlock[]): boolean => {
  return timeBlocks.some(block =>
    timeSlot >= block.start &&
    timeSlot < block.end
  );
};

export const getBlockForTimeSlot = (timeSlot: Date, timeBlocks: TimeBlock[]): TimeBlock | undefined => {
  return timeBlocks.find(block =>
    timeSlot >= block.start &&
    timeSlot < block.end
  );
};

export const getAppointmentForTimeSlot = (
  timeSlot: Date, 
  appointmentBlocks: AppointmentBlock[]
): AppointmentBlock | undefined => {
  // Debug the incoming data
  if (appointmentBlocks.length > 0) {
    console.log("[utils] Checking appointment for time slot:", format(timeSlot, 'HH:mm'));
    console.log("[utils] Available appointment blocks:", appointmentBlocks.map(block => ({
      id: block.id,
      start: format(block.start, 'HH:mm'),
      end: format(block.end, 'HH:mm')
    })));
  }
  
  const appointment = appointmentBlocks.find(block => {
    // Compare only the time part, as the date parts are already filtered at a higher level
    const slotTime = timeSlot;
    const result = slotTime >= block.start && slotTime < block.end;
    
    if (result) {
      console.log(`[utils] Found appointment ${block.id} for time slot ${format(timeSlot, 'HH:mm')}`);
    }
    
    return result;
  });
  
  return appointment;
};

export const isStartOfBlock = (
  timeSlot: Date, 
  block?: TimeBlock
): boolean => {
  if (!block) return false;
  return differenceInMinutes(timeSlot, block.start) < 30;
};

export const isEndOfBlock = (
  timeSlot: Date, 
  block?: TimeBlock
): boolean => {
  if (!block) return false;
  return differenceInMinutes(block.end, addMinutes(timeSlot, 30)) < 30;
};

export const isStartOfAppointment = (
  timeSlot: Date, 
  appointment?: AppointmentBlock
): boolean => {
  if (!appointment) return false;
  return differenceInMinutes(timeSlot, appointment.start) < 30;
};
