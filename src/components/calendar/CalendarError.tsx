
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface CalendarErrorProps {
  error: Error | null;
  onRetry: () => void;
  retryCount: number;
}

const CalendarError: React.FC<CalendarErrorProps> = ({
  error,
  onRetry,
  retryCount
}) => {
  return (
    <div className="p-8 text-center border rounded-lg bg-red-50 border-red-200 my-4">
      <div className="text-xl font-semibold text-red-700 mb-4">
        Something went wrong with the calendar
      </div>
      
      {error && (
        <div className="text-sm text-red-600 mb-4 max-w-md mx-auto">
          {error.message}
        </div>
      )}
      
      <div className="flex flex-col space-y-4 items-center">
        <Button onClick={onRetry} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reload Calendar
        </Button>
        
        {retryCount > 2 && (
          <div className="text-sm text-gray-600 p-3 bg-gray-100 rounded max-w-md">
            <p className="font-semibold">Troubleshooting Tips:</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Check your network connection</li>
              <li>Verify your timezone settings in your profile</li>
              <li>Try clearing browser cache and reloading</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarError;
