import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runAuthDiagnostics, testLoginFlow, testPasswordResetFlow } from "@/utils/authTroubleshooter";

const AuthDiagnostics = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await runAuthDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      console.error("Error running diagnostics:", error);
      setDiagnosticResults({ error });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleTestLogin = async () => {
    if (!testEmail || !testPassword) {
      alert("Please enter both email and password");
      return;
    }

    setIsRunningTest(true);
    try {
      const results = await testLoginFlow(testEmail, testPassword);
      setTestResults(results);
    } catch (error) {
      console.error("Error testing login:", error);
      setTestResults({ error });
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleTestPasswordReset = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    setIsRunningTest(true);
    try {
      const results = await testPasswordResetFlow(testEmail);
      setTestResults(results);
    } catch (error) {
      console.error("Error testing password reset:", error);
      setTestResults({ error });
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication System Diagnostics</CardTitle>
        <CardDescription>
          Use this tool to diagnose issues with the authentication system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="diagnostics">
          <TabsList className="mb-4">
            <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
            <TabsTrigger value="tests">Test Auth Flows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnostics">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Run a comprehensive diagnostic of the authentication system to identify potential issues.
              </p>
              
              <Button 
                onClick={handleRunDiagnostics} 
                disabled={isRunningDiagnostics}
              >
                {isRunningDiagnostics ? "Running Diagnostics..." : "Run Diagnostics"}
              </Button>
              
              {diagnosticResults && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Diagnostic Results:</h3>
                  
                  {/* Configuration summary */}
                  {diagnosticResults.config && (
                    <div className="mb-3 p-2 bg-blue-50 rounded">
                      <h4 className="text-xs font-medium text-blue-800">Configuration</h4>
                      <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                        <div>Supabase URL:</div>
                        <div className="font-mono">{diagnosticResults.config.url}</div>
                        <div>API Key Present:</div>
                        <div>{diagnosticResults.config.hasAnonymousKey ? '✅ Yes' : '❌ No'}</div>
                        <div>Current Origin:</div>
                        <div className="font-mono">{diagnosticResults.config.currentOrigin}</div>
                        <div>Environment:</div>
                        <div>{diagnosticResults.config.environment}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* URL info summary */}
                  {diagnosticResults.urlInfo && (
                    <div className="mb-3 p-2 bg-green-50 rounded">
                      <h4 className="text-xs font-medium text-green-800">URL Information</h4>
                      <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                        <div>Has Reset Token:</div>
                        <div>{diagnosticResults.urlInfo.urlInfo.hasResetToken ? '✅ Yes' : '❌ No'}</div>
                        <div>Current Path:</div>
                        <div className="font-mono">{diagnosticResults.urlInfo.urlInfo.pathname}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Session status */}
                  <div className="mb-3 p-2 bg-purple-50 rounded">
                    <h4 className="text-xs font-medium text-purple-800">Session Status</h4>
                    <div className="mt-1 text-xs">
                      {diagnosticResults.hasSession ?
                        '✅ Active session found' :
                        '❌ No active session'}
                    </div>
                  </div>
                  
                  {/* Raw data (expandable) */}
                  <details>
                    <summary className="text-xs font-medium text-gray-500 cursor-pointer">
                      Raw Diagnostic Data
                    </summary>
                    <pre className="text-xs overflow-auto max-h-96 p-2 bg-gray-100 rounded mt-2">
                      {JSON.stringify(diagnosticResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tests">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label htmlFor="testEmail" className="text-sm font-medium block mb-1">
                    Test Email
                  </label>
                  <Input
                    id="testEmail"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email for testing"
                  />
                </div>
                
                <div>
                  <label htmlFor="testPassword" className="text-sm font-medium block mb-1">
                    Test Password (for login test only)
                  </label>
                  <Input
                    id="testPassword"
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter password for login test"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleTestLogin} 
                    disabled={isRunningTest}
                    variant="outline"
                  >
                    Test Login
                  </Button>
                  
                  <Button 
                    onClick={handleTestPasswordReset} 
                    disabled={isRunningTest}
                    variant="outline"
                  >
                    Test Password Reset
                  </Button>
                </div>
              </div>
              
              {testResults && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Test Results:</h3>
                  <div className={`text-sm p-2 rounded ${testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Status: {testResults.success ? 'Success' : 'Failed'}
                  </div>
                  
                  {/* Error message display */}
                  {!testResults.success && testResults.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
                      <h4 className="text-xs font-medium">Error Details:</h4>
                      <p className="text-xs text-red-700 mt-1">{testResults.error.message || JSON.stringify(testResults.error)}</p>
                    </div>
                  )}
                  
                  {/* Success details */}
                  {testResults.success && testResults.data && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded">
                      <h4 className="text-xs font-medium">Success Details:</h4>
                      {testResults.data.user && (
                        <p className="text-xs text-green-700 mt-1">User authenticated: {testResults.data.user.email}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Raw data (expandable) */}
                  <details>
                    <summary className="text-xs font-medium text-gray-500 cursor-pointer mt-2">
                      Raw Test Data
                    </summary>
                    <pre className="text-xs overflow-auto max-h-96 p-2 bg-gray-100 rounded mt-2">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Check the browser console for detailed diagnostic information
        </p>
      </CardFooter>
    </Card>
  );
};

export default AuthDiagnostics;