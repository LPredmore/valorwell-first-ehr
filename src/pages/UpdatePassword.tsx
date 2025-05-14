
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hashPresent, setHashPresent] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Debug helper function
  const debugAuthOperation = async (operation: string, fn: () => Promise<any>) => {
    console.log(`[DEBUG][${operation}] Starting operation`);
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[DEBUG][${operation}] Completed in ${duration}ms with result:`, result);
      
      // Update debug info with successful result
      setDebugInfo(prev => ({
        ...prev,
        [operation]: {
          status: 'success',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      }));
      
      return result;
    } catch (error: any) {
      const duration = (performance.now() - startTime).toFixed(2);
      console.error(`[DEBUG][${operation}] Failed after ${duration}ms with error:`, error);
      
      // Update debug info with error details
      setDebugInfo(prev => ({
        ...prev,
        [operation]: {
          status: 'error',
          duration: `${duration}ms`,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
      
      throw error;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a hash parameter in the URL which indicates we're coming from a password reset email
        const hash = window.location.hash;
        console.log("[UpdatePassword] Checking URL hash:", hash);
        const hashExists = hash.length > 0;
        setHashPresent(hashExists);

        // If there's no hash, this might not be a valid password reset flow
        if (!hashExists) {
          console.log("[UpdatePassword] No hash found in URL, might not be a valid reset flow");
          setDebugInfo(prev => ({
            ...prev,
            hashCheck: {
              status: 'warning',
              message: 'No hash found in URL',
              timestamp: new Date().toISOString()
            }
          }));
          return;
        }

        // Verify the session is active for password reset
        console.log("[UpdatePassword] Verifying session from hash...");
        const { data, error } = await debugAuthOperation("getSession", () => 
          supabase.auth.getSession()
        );

        if (error) {
          console.error("[UpdatePassword] Session verification error:", error);
          setError(`Session verification failed: ${error.message}`);
          setSessionVerified(false);
          return;
        }

        const session = data?.session;
        console.log("[UpdatePassword] Session data:", session ? "Session exists" : "No session");
        
        if (session) {
          console.log("[UpdatePassword] Found active session, user can reset password");
          setSessionVerified(true);
        } else {
          console.log("[UpdatePassword] No active session found, password reset may fail");
          setError("No active session found. The reset link may have expired.");
          setSessionVerified(false);
        }
      } catch (error: any) {
        console.error("[UpdatePassword] Error in checkSession:", error);
        setError(`Error checking session: ${error.message}`);
      }
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      setError("Password too short");
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!hashPresent) {
      setError("Missing password reset token");
      toast({
        title: "Missing reset token",
        description: "Please use the password reset link from your email.",
        variant: "destructive",
      });
      return;
    }

    console.log("[UpdatePassword] Starting password update process");
    setIsLoading(true);

    // Set a timeout to clear the loading state in case the operation hangs
    const timeoutId = setTimeout(() => {
      console.warn("[UpdatePassword] Update password operation timed out after 15 seconds");
      setIsLoading(false);
      setError("The request timed out. Please try again or request a new reset link.");
      toast({
        title: "Request timed out",
        description: "The password update took too long. Please try again.",
        variant: "destructive",
      });
    }, 15000);

    try {
      // Update the user's password
      const { data, error } = await debugAuthOperation("updatePassword", () =>
        supabase.auth.updateUser({
          password: password
        })
      );

      // Clear the timeout since the operation completed
      clearTimeout(timeoutId);

      if (error) {
        console.error("[UpdatePassword] Error updating password:", error.message);
        setError(`Failed to update password: ${error.message}`);
        throw error;
      }

      console.log("[UpdatePassword] Password updated successfully");
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });

      // Redirect to login page after successful password update
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error("[UpdatePassword] Error details:", error);
      // Clear the timeout if there's an error
      clearTimeout(timeoutId);
      
      toast({
        title: "Failed to update password",
        description: error.message || "There was a problem updating your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Update Password</CardTitle>
          <CardDescription className="text-center">
            {hashPresent ? 
              "Enter your new password below" : 
              "This page is for resetting your password after clicking the link in the reset email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          {!hashPresent && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
              <p className="text-sm font-medium">
                No reset token found. You need to access this page from a password reset email.
              </p>
              <Button 
                variant="link" 
                className="text-sm p-0 h-auto text-yellow-800 underline"
                onClick={() => navigate("/reset-password")}
              >
                Request a new password reset email
              </Button>
            </div>
          )}
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">New Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                disabled={isLoading || !hashPresent}
                className={!hashPresent ? "bg-gray-100" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                disabled={isLoading || !hashPresent}
                className={!hashPresent ? "bg-gray-100" : ""}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !hashPresent}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs font-medium text-gray-500 mb-1">Debug Info:</p>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UpdatePassword;
