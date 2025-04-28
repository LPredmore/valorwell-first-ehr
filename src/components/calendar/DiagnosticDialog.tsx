
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { calendarPermissionDebug } from '@/utils/calendarPermissionDebug';
import { useUser } from '@/context/UserContext';
import { TimeZoneService } from '@/utils/timeZoneService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId?: string;
}

const DiagnosticDialog: React.FC<DiagnosticDialogProps> = ({
  open,
  onOpenChange,
  clinicianId
}) => {
  const { userId } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    if (open && userId && clinicianId) {
      runDiagnostic();
    }
  }, [open, userId, clinicianId]);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const result = await calendarPermissionDebug.runDiagnostic(userId, clinicianId);
      setDiagnosticResult(result);
      
      if (result.success) {
        toast({
          title: "Diagnostic Passed",
          description: "All calendar permission tests passed successfully.",
          variant: "default",
        });
      } else {
        toast({
          title: "Diagnostic Issues Found",
          description: `Found ${result.issues.length} issues that may be affecting calendar functionality.`,
          variant: "warning",
        });
      }
    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast({
        title: "Diagnostic Error",
        description: "An error occurred while running the calendar diagnostic.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFixes = async () => {
    setIsLoading(true);
    try {
      // Only apply fixes for the issues we detect
      if (diagnosticResult?.tests?.uuidFormat?.success === false) {
        await standardizeUuids();
      }
      
      if (diagnosticResult?.tests?.timeZone?.success === false) {
        await fixTimeZone();
      }
      
      toast({
        title: "Fixes Applied",
        description: "Attempted to fix the detected issues. Please run the diagnostic again.",
        variant: "default",
      });
      
      // Run the diagnostic again
      await runDiagnostic();
    } catch (error) {
      console.error('Error applying fixes:', error);
      toast({
        title: "Fix Error",
        description: "An error occurred while applying fixes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const standardizeUuids = async () => {
    try {
      // Ask the backend to standardize UUIDs
      const { error } = await supabase.rpc('standardize_clinician_ids');
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error standardizing UUIDs:', error);
      return false;
    }
  };

  const fixTimeZone = async () => {
    try {
      // Get the browser's timezone
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const validTz = TimeZoneService.ensureIANATimeZone(browserTz);
      
      // Update the profile with the valid timezone
      const { error } = await supabase
        .from('profiles')
        .update({ time_zone: validTz })
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error fixing timezone:', error);
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar Diagnostic Tool</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-center text-gray-600">
              Running diagnostic tests. This may take a moment...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {diagnosticResult?.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
                )}
                <h2 className="font-semibold">
                  {diagnosticResult?.success 
                    ? 'All tests passed!' 
                    : `Found ${diagnosticResult?.issues?.length || 0} issues`}
                </h2>
              </div>
              
              <div className="space-x-2">
                <Button
                  onClick={runDiagnostic}
                  variant="outline"
                  size="sm"
                >
                  Run Again
                </Button>
                
                {!diagnosticResult?.success && (
                  <Button
                    onClick={applyFixes}
                    variant="default"
                    size="sm"
                  >
                    Apply Fixes
                  </Button>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="issues">Issues ({diagnosticResult?.issues?.length || 0})</TabsTrigger>
                <TabsTrigger value="details">Technical Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-4">
                {Object.entries(diagnosticResult?.tests || {}).map(([testName, test]: [string, any]) => (
                  <div 
                    key={testName} 
                    className={`p-4 border rounded-md ${
                      test.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {test.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                        )}
                        <h3 className="font-medium text-sm capitalize">{testName.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        test.success ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {test.success ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    
                    {test.error && (
                      <p className="mt-2 text-sm text-red-600">{test.error}</p>
                    )}
                    
                    {test.details && Object.keys(test.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(test.details).map(([key, value]: [string, any]) => (
                          <div key={key} className="grid grid-cols-2 gap-1">
                            <span className="font-medium">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="issues">
                {(diagnosticResult?.issues || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p>No issues detected!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(diagnosticResult?.issues || []).map((issue: string, index: number) => (
                      <div key={index} className="p-4 border border-amber-200 bg-amber-50 rounded-md">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                          <div>
                            <p className="text-amber-800">{issue}</p>
                            {diagnosticResult?.recommendations?.[index] && (
                              <p className="mt-2 text-sm text-gray-600">
                                <strong>Recommendation:</strong> {diagnosticResult.recommendations[index]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="details">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Raw Diagnostic Data</h3>
                  <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                    {JSON.stringify(diagnosticResult, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DiagnosticDialog;
