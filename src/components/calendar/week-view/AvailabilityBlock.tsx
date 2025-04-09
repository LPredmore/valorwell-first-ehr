
import React from 'react';
import { format } from 'date-fns';
import { TimeBlock } from './useWeekViewData';

interface AvailabilityBlockProps {
  block: TimeBlock;
  day: Date;
  hourHeight: number;
  onAvailabilityClick?: (day: Date, block: TimeBlock) => void;
}

const AvailabilityBlock: React.FC<AvailabilityBlockProps> = ({
  block,
  day,
  hourHeight,
  onAvailabilityClick
}) => {
  // Calculate position and height based on start and end time
  const startHour = block.start.getHours() + (block.start.getMinutes() / 60);
  const endHour = block.end.getHours() + (block.end.getMinutes() / 60);
  const duration = endHour - startHour;
  
  // First hour shown is 6 AM (index 0), so adjust position calculation
  // by subtracting 6 from the hour to get the correct vertical offset
  const displayStartHour = startHour - 6;
  const top = displayStartHour * hourHeight + 56; // 56px is the header height
  const height = duration * hourHeight;

  const handleClick = () => {
    if (onAvailabilityClick) {
      // Create full block data with properly formatted time strings
      const formattedBlock = {
        ...block,
        id: block.id,
        start_time: format(block.start, 'HH:mm'),
        end_time: format(block.end, 'HH:mm'),
        isException: block.isException,
        isStandalone: block.isStandalone,
        originalAvailabilityId: block.originalAvailabilityId,
        availabilityIds: block.availabilityIds
      };
      
      console.log('Availability block clicked with formatted times:', {
        day: format(day, 'yyyy-MM-dd'),
        block: formattedBlock,
        startHour,
        displayStartHour,
        topPosition: top
      });
      
      onAvailabilityClick(day, formattedBlock);
    }
  };

  // Choose block color based on type
  let blockColor;
  if (block.isStandalone) {
    blockColor = 'purple'; // Standalone exceptions are purple
  } else if (block.isException) {
    blockColor = 'teal';   // Modified regular availability is teal
  } else {
    blockColor = 'green';  // Regular weekly availability is green
  }

  // Log rendering for debugging
  React.useEffect(() => {
    console.debug('Rendering availability block:', {
      id: block.id,
      day: format(day, 'yyyy-MM-dd'),
      start: format(block.start, 'HH:mm'),
      end: format(block.end, 'HH:mm'),
      startHour,
      displayStartHour,
      position: { top, height },
      isException: block.isException,
      isStandalone: block.isStandalone
    });
  }, [block.id, day, block.start, block.end, block.isException, block.isStandalone, top, height, startHour]);

  return (
    <div 
      className={`absolute left-0.5 right-0.5 z-5 rounded-md border border-${blockColor}-400 bg-${blockColor}-50 p-1 overflow-hidden cursor-pointer hover:opacity-90 transition-colors`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        maxHeight: `${Math.max(height, 24)}px` // Ensure minimum height for very short blocks
      }}
      onClick={handleClick}
    >
      <div className="flex flex-col h-full text-xs">
        <div className="font-medium truncate flex items-center">
          Available
          {block.isException && block.isStandalone && (
            <span className="ml-1 text-[10px] px-1 py-0.5 bg-purple-100 text-purple-800 rounded-full">One-time</span>
          )}
          {block.isException && !block.isStandalone && (
            <span className="ml-1 text-[10px] px-1 py-0.5 bg-teal-100 text-teal-800 rounded-full">Modified</span>
          )}
        </div>
        {height >= 40 && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {format(block.start, 'h:mm a')} - {format(block.end, 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityBlock;
