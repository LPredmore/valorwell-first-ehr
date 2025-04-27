
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CalendarAuthError: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Authentication required. Please <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>log in</Button> to access the calendar.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CalendarAuthError;
