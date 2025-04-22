
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Check, Loader2, RefreshCw } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';

interface GoogleCalendarIntegrationProps {
  clinicianId: string;
  userTimeZone: string;
  onSyncComplete?: () => void;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({
  clinicianId,
  userTimeZone,
  onSyncComplete
}) => {
  const { toast } = useToast();
  const { userId } = useUser();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncSettings, setSyncSettings] = useState({
    syncAppointments: true,
    syncAvailability: true,
    importBlockedTimes: true
  });

  const {
    isGoogleApiReady,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useGoogleCalendar(clinicianId, userTimeZone);

  useEffect(() => {
    const fetchLastSyncTime = async () => {
      if (!clinicianId) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('google_calendar_last_sync')
        .eq('id', clinicianId)
        .single();
        
      if (!error && data?.google_calendar_last_sync) {
        setLastSyncTime(data.google_calendar_last_sync);
      }
    };
    
    fetchLastSyncTime();
  }, [clinicianId]);

  const handleConnect = async () => {
    try {
      await connectGoogleCalendar();
      
      // Update the profile to mark Google Calendar as linked
      if (clinicianId) {
        await supabase
          .from('profiles')
          .update({ 
            google_calendar_linked: true,
            google_calendar_last_sync: new Date().toISOString()
          })
          .eq('id', clinicianId);
          
        setLastSyncTime(new Date().toISOString());
      }
      
      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been successfully connected."
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Calendar. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnectGoogleCalendar();
      
      // Update the profile to mark Google Calendar as unlinked
      if (clinicianId) {
        await supabase
          .from('profiles')
          .update({ google_calendar_linked: false })
          .eq('id', clinicianId);
      }
      
      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar has been disconnected."
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error("Error disconnecting from Google Calendar:", error);
      toast({
        title: "Disconnection Failed",
        description: "Could not disconnect from Google Calendar. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // This would be implemented in a future step to actually sync events
      toast({
        title: "Sync Started",
        description: "Synchronizing with Google Calendar..."
      });
      
      // Update last sync time
      if (clinicianId) {
        const now = new Date().toISOString();
        await supabase
          .from('profiles')
          .update({ google_calendar_last_sync: now })
          .eq('id', clinicianId);
          
        setLastSyncTime(now);
      }
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast({
        title: "Sync Failed",
        description: "Could not sync with Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleChange = (setting: keyof typeof syncSettings) => {
    setSyncSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // If the Google API isn't ready yet, show a loading state
  if (!isGoogleApiReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-gray-500">Loading Google Calendar API...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync availability and appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isGoogleCalendarConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" /> Connected to Google Calendar
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last synced: {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
            </div>
            
            <div className="space-y-3 border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-medium">Sync Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="syncAppointments">Sync Appointments</Label>
                  <p className="text-xs text-gray-500">Push appointments to Google Calendar</p>
                </div>
                <Switch
                  id="syncAppointments"
                  checked={syncSettings.syncAppointments}
                  onCheckedChange={() => handleToggleChange('syncAppointments')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="syncAvailability">Sync Availability</Label>
                  <p className="text-xs text-gray-500">Push availability blocks to Google Calendar</p>
                </div>
                <Switch
                  id="syncAvailability"
                  checked={syncSettings.syncAvailability}
                  onCheckedChange={() => handleToggleChange('syncAvailability')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="importBlockedTimes">Import Blocked Times</Label>
                  <p className="text-xs text-gray-500">Block availability when Google Calendar shows you're busy</p>
                </div>
                <Switch
                  id="importBlockedTimes"
                  checked={syncSettings.importBlockedTimes}
                  onCheckedChange={() => handleToggleChange('importBlockedTimes')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-center text-gray-500 mb-4">
              Connect your Google Calendar to automatically sync appointments and availability
            </p>
            <Button onClick={handleConnect}>
              Connect to Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
      {isGoogleCalendarConnected && (
        <CardFooter className="justify-end border-t border-gray-200 pt-4">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default GoogleCalendarIntegration;
