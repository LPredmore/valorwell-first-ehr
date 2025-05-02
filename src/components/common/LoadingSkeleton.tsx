
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  count?: number;
}

const LoadingSkeleton = ({ height = '20px', width = '100%', className = '', count = 1 }: LoadingSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton 
          key={index}
          className={className}
          style={{
            height,
            width,
            marginBottom: index < count - 1 ? '0.5rem' : 0
          }}
        />
      ))}
    </>
  );
};

export default LoadingSkeleton;
