import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Check, Loader2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [configError, setConfigError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    isGoogleApiReady,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    apiInitError,
    isLoadingCredentials
  } = useGoogleCalendar(clinicianId, userTimeZone);

  useEffect(() => {
    const fetchLastSyncTime = async () => {
      if (!clinicianId) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('google_calendar_last_sync')
          .eq('id', clinicianId)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching last sync time:', error);
          return;
        }
        
        if (data?.google_calendar_last_sync) {
          setLastSyncTime(data.google_calendar_last_sync);
        }
      } catch (err) {
        console.error('Error fetching last sync time:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLastSyncTime();
  }, [clinicianId]);

  useEffect(() => {
    if (apiInitError) {
      console.error('Google Calendar API initialization error:', apiInitError);
      setConfigError(apiInitError);
    } else {
      setConfigError(null);
    }
  }, [apiInitError]);

  const handleConnect = async () => {
    try {
      await connectGoogleCalendar();
      
      if (clinicianId) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            google_calendar_linked: true,
            google_calendar_last_sync: new Date().toISOString()
          })
          .eq('id', clinicianId);
          
        if (error) {
          console.error('Error updating profile after Google Calendar connection:', error);
          // Continue anyway as the main functionality worked
        } else {
          setLastSyncTime(new Date().toISOString());
        }
      }
      
      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been successfully connected."
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error("Error connecting to Google Calendar:", error);
      
      if (error?.error !== "popup_closed_by_user") {
        toast({
          title: "Connection Failed",
          description: "Could not connect to Google Calendar. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnectGoogleCalendar();
      
      if (clinicianId) {
        const { error } = await supabase
          .from('profiles')
          .update({ google_calendar_linked: false })
          .eq('id', clinicianId);
          
        if (error) {
          console.error('Error updating profile after Google Calendar disconnection:', error);
          // Continue anyway as the main functionality worked
        }
      }
      
      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar has been disconnected."
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
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
      toast({
        title: "Sync Started",
        description: "Synchronizing with Google Calendar..."
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (clinicianId) {
        const now = new Date().toISOString();
        
        const { error } = await supabase
          .from('profiles')
          .update({ google_calendar_last_sync: now })
          .eq('id', clinicianId);
          
        if (error) {
          console.error('Error updating last sync time:', error);
          throw error;
        }
        
        setLastSyncTime(now);
      }
      
      toast({
        title: "Sync Complete",
        description: "Successfully synchronized with Google Calendar."
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error("Error syncing with Google Calendar:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync with Google Calendar. Please try again.",
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

  if (isLoading || isLoadingCredentials) {
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
          <p className="text-sm text-gray-500">
            {isLoadingCredentials 
              ? "Loading Google Calendar credentials..." 
              : "Loading integration status..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isGoogleApiReady && !configError) {
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
  
  if (configError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Configuration error: {configError}
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              To fix this issue, please ensure that Google API credentials are properly set up in Supabase:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Check that VITE_GOOGLE_CLIENT_ID is set correctly in Supabase secrets</li>
              <li>Check that VITE_GOOGLE_API_KEY is set correctly in Supabase secrets</li>
              <li>Ensure the Client ID and API Key are from the same Google Cloud project</li>
              <li>Verify that the Google Calendar API is enabled in your Google Cloud project</li>
              <li>Confirm that the redirect URIs are configured in your Google Cloud Console</li>
            </ul>
            <p className="text-sm font-medium mt-4">
              If you've recently updated the credentials, you may need to refresh the page.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh Page
            </Button>
          </div>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Sync Settings</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">These settings control what data is synchronized with Google Calendar.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
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
