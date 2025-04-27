
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
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { calendarPermissionDebug } from '@/utils/calendarPermissionDebug';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { authDebugUtils } from '@/utils/authDebugUtils';

interface CalendarDiagnosticDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClinicianId: string | null;
}

const CalendarDiagnosticDialog: React.FC<CalendarDiagnosticDialogProps> = ({
  isOpen,
  onClose,
  selectedClinicianId
}) => {
  const { currentUserId } = useCalendarAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, any> | null>(null);
  const [authState, setAuthState] = useState<Record<string, any> | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen, selectedClinicianId, currentUserId]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              
              {renderTroubleshootingSteps()}
              
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2 text-sm">Auth Details</h3>
                <div className="text-xs overflow-auto max-h-[150px]">
                  <pre>{JSON.stringify(authState, null, 2)}</pre>
                </div>
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
          
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDiagnosticDialog;
