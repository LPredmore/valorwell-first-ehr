
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
  // Calculate position and height for the availability block
  const topPosition = (block.start.getHours() + block.start.getMinutes() / 60) * hourHeight;
  const blockHeight = (block.end.getHours() + block.end.getMinutes() / 60 - block.start.getHours() - block.start.getMinutes() / 60) * hourHeight;
  
  // Debug logging for this specific block to help diagnose issues
  React.useEffect(() => {
    console.log(`Rendering availability block:`, {
      day: format(day, 'yyyy-MM-dd'),
      start: format(block.start, 'HH:mm'),
      end: format(block.end, 'HH:mm'),
      ids: block.availabilityIds,
      isException: block.isException,
      isStandalone: block.isStandalone
    });
  }, [block, day]);

  // Determine styling based on block type
  let blockColor = 'bg-green-100 border-green-300';
  let textColor = 'text-green-800';
  
  if (block.isException) {
    if (block.isStandalone) {
      // Standalone (one-time) availability
      blockColor = 'bg-purple-100 border-purple-300';
      textColor = 'text-purple-800';
    } else {
      // Modified availability
      blockColor = 'bg-blue-100 border-blue-300';
      textColor = 'text-blue-800';
    }
  }

  const handleClick = () => {
    if (onAvailabilityClick) {
      console.log('Availability block clicked:', {
        day: format(day, 'yyyy-MM-dd'),
        blockStart: format(block.start, 'HH:mm'),
        blockEnd: format(block.end, 'HH:mm'),
        blockIds: block.availabilityIds,
        isException: block.isException,
        isStandalone: block.isStandalone
      });
      onAvailabilityClick(day, block);
    }
  };

  return (
    <div
      className={`absolute border rounded-md px-2 py-1 cursor-pointer z-10 ${blockColor} ${textColor}`}
      style={{
        top: `${topPosition + 56}px`, // 56px is the header height
        height: `${blockHeight}px`,
        left: '4px',
        right: '4px',
      }}
      onClick={handleClick}
    >
      <div className="text-xs font-medium">
        {format(block.start, 'h:mm a')} - {format(block.end, 'h:mm a')}
      </div>
      <div className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
        {block.isException ? 'Modified' : 'Regular'} 
        {block.isStandalone ? ' (One-time)' : ''}
      </div>
    </div>
  );
};

export default AvailabilityBlock;
