
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
      onAvailabilityClick(day, block);
    }
  };

  // Log rendering for debugging
  React.useEffect(() => {
    console.debug('Rendering availability block:', {
      id: block.id,
      day: format(day, 'yyyy-MM-dd'),
      start: format(block.start, 'HH:mm'),
      end: format(block.end, 'HH:mm'),
      startHour,
      displayStartHour,
      position: { top, height }
    });
  }, [block.id, day, block.start, block.end, top, height, startHour]);

  return (
    <div 
      className={`absolute left-0.5 right-0.5 z-5 rounded-md border border-green-400 bg-green-50 p-1 overflow-hidden cursor-pointer hover:bg-green-100`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        maxHeight: `${Math.max(height, 24)}px` // Ensure minimum height for very short blocks
      }}
      onClick={handleClick}
      role="button"
      aria-label={`Available from ${format(block.start, 'h:mm a')} to ${format(block.end, 'h:mm a')}`}
    >
      <div className="flex flex-col h-full text-xs">
        <div className="font-medium truncate flex items-center">
          Available
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
