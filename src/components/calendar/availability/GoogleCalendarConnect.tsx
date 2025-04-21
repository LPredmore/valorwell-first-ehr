
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, RefreshCcw, Link, Unlink, Check, AlertCircle } from 'lucide-react';
import { useAvailability } from './AvailabilityContext';
import { format } from 'date-fns';

interface GoogleCalendarConnectProps {
  className?: string;
}

const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({ className }) => {
  const { 
    isGoogleLinked,
    isGoogleAuthenticated,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncWithGoogleCalendar,
    isSyncing,
    lastSyncTime
  } = useAvailability();
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Google Calendar Integration
            </CardTitle>
            <CardDescription>Sync your availability with Google Calendar</CardDescription>
          </div>
          {isGoogleLinked && (
            <Badge variant={isGoogleAuthenticated ? "default" : "outline"}>
              {isGoogleAuthenticated ? (
                <div className="flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Connected
                </div>
              ) : "Disconnected"}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isGoogleLinked ? (
          <div className="space-y-4">
            <p className="text-sm">
              Your calendar is connected to Google Calendar. Any changes to your availability will be synchronized.
            </p>
            
            {lastSyncTime && (
              <div className="text-xs text-gray-500">
                Last synced: {format(new Date(lastSyncTime), 'PPpp')}
              </div>
            )}
            
            {!isGoogleAuthenticated && (
              <div className="flex rounded-lg bg-amber-50 p-3 text-amber-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Authentication expired</p>
                  <p className="text-sm">
                    Your Google Calendar authentication has expired. Please reconnect to continue syncing.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Connect your Google Calendar to sync your availability. This allows for two-way synchronization of your
              calendar events.
            </p>
            
            <div className="flex rounded-lg bg-blue-50 p-3 text-blue-800">
              <div>
                <p className="font-medium">Benefits of connecting</p>
                <ul className="text-sm list-disc ml-4">
                  <li>View all your appointments in one place</li>
                  <li>Automatically reflect changes in both calendars</li>
                  <li>Avoid double-bookings</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {isGoogleLinked ? (
          <>
            <Button
              variant="outline"
              onClick={disconnectGoogleCalendar}
              disabled={isSyncing}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
            
            <Button
              onClick={syncWithGoogleCalendar}
              disabled={isSyncing || !isGoogleAuthenticated}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </>
        ) : (
          <Button onClick={connectGoogleCalendar}>
            <Link className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GoogleCalendarConnect;
