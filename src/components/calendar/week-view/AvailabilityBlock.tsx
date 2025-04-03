
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
  
  const top = startHour * hourHeight + 56; // 56px is the header height
  const height = duration * hourHeight;

  const handleClick = () => {
    if (onAvailabilityClick) {
      console.log('Availability block clicked:', {
        day: format(day, 'yyyy-MM-dd'),
        block: {
          id: block.id,
          start: format(block.start, 'HH:mm'),
          end: format(block.end, 'HH:mm'),
          isException: block.isException,
          originalAvailabilityId: block.originalAvailabilityId
        }
      });
      onAvailabilityClick(day, block);
    }
  };

  const blockColor = block.isException ? 'teal' : 'green';

  // Log rendering for debugging
  React.useEffect(() => {
    console.debug('Rendering availability block:', {
      id: block.id,
      day: format(day, 'yyyy-MM-dd'),
      start: format(block.start, 'HH:mm'),
      end: format(block.end, 'HH:mm'),
      isException: block.isException,
      position: { top, height },
    });
  }, [block.id, day, block.start, block.end, block.isException, top, height]);

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
          {block.isException && (
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
