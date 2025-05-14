import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { debugAuthOperation } from "@/utils/authDebugUtils";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const [email, setEmail] = useState(emailParam || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const timeoutRef = useRef<number | null>(null);

  const testEmailDelivery = async (email: string) => {
    try {
      console.log("[ResetPassword] Testing email delivery with test-resend function");
      
      // Get current access token if available
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token || '';
      
      const response = await fetch(`https://gqlkritspnhjxfejvgfg.supabase.co/functions/v1/test-resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      console.log("[ResetPassword] Test email delivery result:", result);
      
      return result;
    } catch (error) {
      console.error("[ResetPassword] Test email delivery error:", error);
      return { success: false, error: error };
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setDebugInfo({});
    
    console.log("[ResetPassword] Starting password reset for email:", email);
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set a timeout to clear the loading state in case the operation hangs
    timeoutRef.current = window.setTimeout(() => {
      console.warn("[ResetPassword] Reset password operation timed out after 30 seconds");
      setIsLoading(false);
      setErrorMessage("The request timed out. Please try again.");
      setDebugInfo(prev => ({
        ...prev,
        timeout: {
          timestamp: new Date().toISOString(),
          message: "Operation timed out after 30 seconds"
        }
      }));
      toast({
        title: "Request timed out",
        description: "The password reset request took too long. Please try again.",
        variant: "destructive",
      });
    }, 30000) as unknown as number;
    
    try {
      setIsLoading(true);
      
      // Use the origin to build the proper redirect URL
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/update-password`;
      
      console.log("[ResetPassword] Using redirect URL:", redirectTo);
      
      // Save URL details for debugging
      setDebugInfo(prev => ({
        ...prev,
        urlDetails: {
          siteUrl,
          redirectTo,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Test email delivery to see if Resend is working
      const testResult = await testEmailDelivery(email);
      setDebugInfo(prev => ({
        ...prev,
        testEmailResult: testResult
      }));
      
      // Call Supabase Auth API directly
      const { data, error } = await debugAuthOperation("resetPasswordForEmail", () =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo,
        })
      );
      
      setDebugInfo(prev => ({
        ...prev,
        supabaseResponse: {
          data,
          error: error ? {
            message: error.message,
            status: error.status
          } : null,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Clear the timeout since the operation completed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (error) {
        console.error("[ResetPassword] Error:", error.message);
        setErrorMessage(error.message);
        throw error;
      }
      
      setSuccessMessage("Password reset email sent successfully!");
      console.log("[ResetPassword] Password reset email sent successfully");
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });
    } catch (error: any) {
      console.error("[ResetPassword] Error details:", error);
      // Clear the timeout if there's an error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      toast({
        title: "Failed to send reset email",
        description: error.message || "There was a problem sending the reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setDebugInfo(prev => ({ ...prev, testingEmail: true }));
    
    try {
      const result = await testEmailDelivery(email);
      setDebugInfo(prev => ({ 
        ...prev, 
        directTestResult: result,
        timestamp: new Date().toISOString()
      }));
      
      if (result.success) {
        toast({
          title: "Test email sent",
          description: "A test email was sent successfully. Please check your inbox.",
        });
      } else {
        toast({
          title: "Test email failed",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[ResetPassword] Test email error:", error);
      toast({
        title: "Test email failed",
        description: error.message || "There was a problem sending the test email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setDebugInfo(prev => ({ ...prev, testingEmail: false }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
              <p className="text-sm font-medium">{successMessage}</p>
              <p className="text-xs mt-1">Please check your email for further instructions.</p>
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading || !!successMessage}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !!successMessage}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
            
            {/* Test email functionality (in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleTestEmail}
                  disabled={isLoading || !email}
                >
                  Test Email Delivery
                </Button>
              </div>
            )}
          </form>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <details>
                <summary className="text-xs font-medium text-gray-500 cursor-pointer">Debug Info:</summary>
                <pre className="text-xs text-gray-600 overflow-auto max-h-60 mt-2">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
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

export default ResetPassword;
