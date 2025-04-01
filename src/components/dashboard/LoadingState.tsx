
import React from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  onClose?: () => void;
  title?: string;
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  onClose, 
  title = "Loading", 
  message = "Loading data..." 
}) => {
  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        {onClose && (
          <Button variant="outline" size="icon" onClick={onClose}>
            <Skeleton className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="border rounded-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-gray-700" />
          <Skeleton className="h-6 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
