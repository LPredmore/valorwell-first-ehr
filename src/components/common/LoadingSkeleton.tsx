
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  height = '100px',
  width = '100%',
  className = '',
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton 
          key={idx} 
          className={`block ${className}`} 
          style={{ height, width }} 
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
