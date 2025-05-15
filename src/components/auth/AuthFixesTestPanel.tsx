import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthDebug } from "@/debug";

const AuthFixesTestPanel = () => {
  const [testResults, setTestResults] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const handleRunAuthFixesTest = async () => {
    setIsRunningTest(true);
    setTestResults(null);
    try {
      const result = await AuthDebug.testAuthFixes();
      setTestResults(result);
    } catch (error) {
      console.error("Error running auth fixes test:", error);
      setTestResults(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleVerifyAuthInitializedFlag = () => {
    try {
      const result = AuthDebug.verifyAuthInitializedFlag();
      setTestResults(result);
    } catch (error) {
      console.error("Error verifying authInitialized flag:", error);
      setTestResults(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Authentication Fixes Test</CardTitle>
        <CardDescription>
          Test the fixes for the authInitialized flag issue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button 
              onClick={handleRunAuthFixesTest} 
              disabled={isRunningTest}
              variant="default"
            >
              {isRunningTest ? "Running Test..." : "Run Auth Fixes Test"}
            </Button>
            <Button 
              onClick={handleVerifyAuthInitializedFlag} 
              variant="outline"
            >
              Verify authInitialized Flag
            </Button>
          </div>
          
          {testResults && (
            <div className="mt-4 p-4 bg-gray-50 border rounded-md">
              <h3 className="text-sm font-medium mb-2">Test Results:</h3>
              <p className="text-sm">{testResults}</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Check the browser console (F12) for detailed test output and instructions.</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-sm text-blue-800">
            <h3 className="font-medium mb-1">How to Test Authentication Fixes</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click "Run Auth Fixes Test" to execute the test script</li>
              <li>Open the browser console (F12) to view detailed test output</li>
              <li>Navigate to the Index page (/) to test redirection behavior</li>
              <li>Verify that you are redirected based on your role without getting stuck in loading</li>
              <li>Use "Verify authInitialized Flag" for instructions on checking the flag value</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthFixesTestPanel;