
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading calendar..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px] bg-gray-50 rounded-md">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;
