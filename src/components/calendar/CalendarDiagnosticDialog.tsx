
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { calendarPermissionDebug } from '@/utils/calendarPermissionDebug';
import { compareIds } from '@/utils/calendarDebugUtils';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { authDebugUtils } from '@/utils/authDebugUtils';
import { useDialogs } from '@/context/DialogContext';
import { TimeZoneService } from '@/utils/timeZoneService';

interface CalendarDiagnosticDialogProps {
  selectedClinicianId: string | null;
}

const CalendarDiagnosticDialog: React.FC<CalendarDiagnosticDialogProps> = ({
  selectedClinicianId
}) => {
  const { isDiagnosticOpen: isOpen, closeDiagnosticDialog: onClose } = useDialogs();
  const { currentUserId, normalizeId } = useCalendarAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, any> | null>(null);
  const [authState, setAuthState] = useState<Record<string, any> | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [timeZoneInfo, setTimeZoneInfo] = useState<Record<string, any> | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
      checkTimeZone();
    }
  }, [isOpen, selectedClinicianId, currentUserId]);

  const checkTimeZone = async () => {
    try {
      const now = new Date();
      const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const utcOffset = now.getTimezoneOffset();
      const systemTimeZoneName = TimeZoneService.ensureIANATimeZone(systemTimeZone || 'UTC');
      
      setTimeZoneInfo({
        systemTimeZone,
        utcOffsetMinutes: utcOffset,
        utcOffsetFormatted: `UTC${utcOffset <= 0 ? '+' : '-'}${Math.abs(Math.floor(utcOffset / 60))}:${String(Math.abs(utcOffset % 60)).padStart(2, '0')}`,
        systemTimeZoneName,
        dateTimeFormatted: now.toLocaleString(),
        nowIsoString: now.toISOString()
      });
    } catch (error) {
      console.error('Error checking timezone:', error);
      setTimeZoneInfo({
        error: String(error)
      });
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDiagnosticResults(null);
    
    try {
      // Get authentication state
      const authData = await authDebugUtils.getAuthState();
      setAuthState(authData);
      
      // Run full diagnostic
      const results = await calendarPermissionDebug.runDiagnostic(
        currentUserId,
        selectedClinicianId
      );
      
      // Add ID comparison results
      if (currentUserId && selectedClinicianId) {
        results.idComparison = {
          directMatch: currentUserId === selectedClinicianId,
          normalizedMatch: compareIds(currentUserId, selectedClinicianId, 'currentUserId', 'selectedClinicianId'),
          normalizedCurrentUserId: normalizeId(currentUserId),
          normalizedSelectedClinicianId: normalizeId(selectedClinicianId)
        };
      }
      
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setDiagnosticResults({
        success: false,
        error: String(error),
        summary: 'Failed to run diagnostics due to an unexpected error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (name: string, test: any) => {
    if (!test) return null;
    
    return (
      <div className="mb-4 p-3 border rounded-md">
        <div className="flex items-center mb-2">
          {test.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
          )}
          <h3 className="font-semibold">{name}</h3>
        </div>
        <p className="text-sm mb-2">{test.message}</p>
        
        {!test.success && test.error && (
          <p className="text-xs text-red-600 italic">Error: {test.error}</p>
        )}
      </div>
    );
  };

  const renderTroubleshootingSteps = () => {
    if (!diagnosticResults) return null;
    
    const steps = calendarPermissionDebug.getTroubleshootingSteps(diagnosticResults);
    if (steps.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderIdComparison = () => {
    if (!diagnosticResults?.idComparison) return null;
    
    const { directMatch, normalizedMatch, normalizedCurrentUserId, normalizedSelectedClinicianId } = diagnosticResults.idComparison;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h3 className="font-semibold mb-2">ID Comparison</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Direct ID match:</span> 
            <span className={directMatch ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
              {directMatch ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Normalized ID match:</span> 
            <span className={normalizedMatch ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {normalizedMatch ? "Yes" : "No"}
            </span>
          </div>
          <div className="text-xs mt-2 space-y-1">
            <div><strong>User ID:</strong> {currentUserId}</div>
            <div><strong>Normalized User ID:</strong> {normalizedCurrentUserId}</div>
            <div><strong>Clinician ID:</strong> {selectedClinicianId}</div>
            <div><strong>Normalized Clinician ID:</strong> {normalizedSelectedClinicianId}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTimeZoneInfo = () => {
    if (!timeZoneInfo) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">Time Zone Information</h3>
        <div className="text-xs space-y-1">
          <div><strong>Browser Time Zone:</strong> {timeZoneInfo.systemTimeZone}</div>
          <div><strong>UTC Offset:</strong> {timeZoneInfo.utcOffsetFormatted} ({timeZoneInfo.utcOffsetMinutes} minutes)</div>
          <div><strong>Current Local Time:</strong> {timeZoneInfo.dateTimeFormatted}</div>
          <div><strong>ISO String:</strong> {timeZoneInfo.nowIsoString}</div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar Permissions Diagnostic</DialogTitle>
          <DialogDescription>
            Troubleshooting calendar permission issues
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Running diagnostic tests...</p>
            </div>
          )}
          
          {diagnosticResults && (
            <>
              <Alert variant={diagnosticResults.success ? "default" : "destructive"} className="mb-4">
                {diagnosticResults.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{diagnosticResults.summary}</AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                {renderTestResult('Authentication', diagnosticResults.tests.auth)}
                {renderTestResult('User Profile', diagnosticResults.tests.userProfile)}
                {renderTestResult('Clinician Profile', diagnosticResults.tests.clinicianProfile)}
                {renderTestResult('Calendar Permissions', diagnosticResults.tests.calendarPermissions)}
              </div>
              
              {renderIdComparison()}
              {renderTimeZoneInfo()}
              {renderTroubleshootingSteps()}
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={() => setShowFullDetails(!showFullDetails)}
                >
                  {showFullDetails ? (
                    <>Hide Full Details <ArrowUp className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Show Full Details <ArrowDown className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                
                {showFullDetails && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h3 className="font-semibold mb-2 text-sm">Auth Details</h3>
                    <div className="text-xs overflow-auto max-h-[150px]">
                      <pre>{JSON.stringify(authState, null, 2)}</pre>
                    </div>
                    
                    <h3 className="font-semibold mb-2 mt-4 text-sm">Diagnostic Results</h3>
                    <div className="text-xs overflow-auto max-h-[150px]">
                      <pre>{JSON.stringify(diagnosticResults, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={runDiagnostics}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Run Again
          </Button>
          
          <Button onClick={() => onClose()}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDiagnosticDialog;
