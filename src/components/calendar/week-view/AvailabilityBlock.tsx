
import React from 'react';
import { format } from 'date-fns';
import { TimeBlock } from './types/availability-types';
import { Clock, Edit } from 'lucide-react';

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
    console.log('AvailabilityBlock clicked, forwarding to handler with block:', block);
    if (onAvailabilityClick) {
      onAvailabilityClick(day, block);
    }
  };

  // Determine block color based on its type (regular, exception, or standalone)
  let bgColor = 'bg-green-50';
  let borderColor = 'border-green-400';
  let textColor = 'text-green-800';
  let badgeColor = '';
  let badgeText = '';

  if (block.isException) {
    // Modified recurring availability
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-400';
    textColor = 'text-blue-800';
    badgeColor = 'bg-blue-100 text-blue-800';
    badgeText = 'Modified';
  } else if (block.isStandalone) {
    // One-time availability
    bgColor = 'bg-indigo-50';
    borderColor = 'border-indigo-400';
    textColor = 'text-indigo-800';
    badgeColor = 'bg-indigo-100 text-indigo-800';
    badgeText = 'One-time';
  }

  return (
    <div 
      className={`absolute left-0.5 right-0.5 z-5 rounded-md border ${borderColor} ${bgColor} p-1 overflow-hidden cursor-pointer hover:opacity-90 transition-colors hover:shadow-md group`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        maxHeight: `${Math.max(height, 24)}px` // Ensure minimum height for very short blocks
      }}
      onClick={handleClick}
    >
      <div className={`flex flex-col h-full text-xs ${textColor}`}>
        <div className="font-medium truncate flex items-center justify-between">
          <span>Available</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit className="h-3 w-3" />
          </div>
        </div>
        {(block.isException || block.isStandalone) && (
          <span className={`text-[10px] px-1 py-0.5 rounded-full ${badgeColor}`}>{badgeText}</span>
        )}
        {height >= 40 && (
          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {format(block.start, 'h:mm a')} - {format(block.end, 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityBlock;
