
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password cannot be longer than 72 characters" }),
  confirmPassword: z.string(),
})
.refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const adminResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password cannot be longer than 72 characters" }),
});

const standardResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// Define the structure of a user in the response
interface SupabaseUser {
  id: string;
  email?: string;
  // Add other properties as needed
}

// Define the structure of the listUsers response
interface ListUsersResponse {
  users: SupabaseUser[];
  // Add other properties as needed
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isAdminReset, setIsAdminReset] = useState(false);
  const [isStandardReset, setIsStandardReset] = useState(false);
  const [showAdminSuccessDialog, setShowAdminSuccessDialog] = useState(false);
  const [showResetEmailSentDialog, setShowResetEmailSentDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add debug log function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [...prev, logMessage]);
  };

  // Extract email from query parameters if provided
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const adminResetForm = useForm<z.infer<typeof adminResetSchema>>({
    resolver: zodResolver(adminResetSchema),
    defaultValues: {
      email: emailParam || "",
      password: "",
    },
  });

  const standardResetForm = useForm<z.infer<typeof standardResetSchema>>({
    resolver: zodResolver(standardResetSchema),
    defaultValues: {
      email: emailParam || "",
    },
  });

  useEffect(() => {
    // Log initial state and params
    addDebugLog(`[RESET PASSWORD] Page loaded. URL: ${window.location.href}`);
    addDebugLog(`[RESET PASSWORD] Hash present: ${!!window.location.hash}, Hash value: ${window.location.hash}`);
    addDebugLog(`[RESET PASSWORD] Email param present: ${!!emailParam}, Email value: ${emailParam || 'none'}`);
    
    // Log current URL and query parameters
    addDebugLog(`[RESET PASSWORD] Current path: ${location.pathname}`);
    addDebugLog(`[RESET PASSWORD] Current search: ${location.search}`);
    
    // If no hash but email parameter exists, show standard reset form
    if (emailParam && !window.location.hash) {
      addDebugLog(`[RESET PASSWORD] Showing standard reset form with email: ${emailParam}`);
      setIsStandardReset(true);
      setIsAdminReset(false);
      setIsValid(false);
      return;
    }
    
    // If no hash and no email, show admin reset form
    if (!window.location.hash && !emailParam) {
      addDebugLog(`[RESET PASSWORD] Showing admin reset form (no hash, no email)`);
      setIsAdminReset(true);
      setIsStandardReset(false);
      setIsValid(false);
      return;
    }

    // Check if we have hash parameters for the password reset
    const hash = window.location.hash;
    if (!hash) {
      addDebugLog(`[RESET PASSWORD] No hash found in URL`);
      setIsValid(false);
      setValidationMessage("Invalid or expired password reset link.");
      return;
    }

    // Supabase automatically handles the hash fragment from a password reset link
    const checkSession = async () => {
      addDebugLog(`[RESET PASSWORD] Checking session with Supabase`);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          addDebugLog(`[RESET PASSWORD] Error checking session: ${error.message}`);
          console.error("[ResetPassword] Error checking session:", error.message);
          setIsValid(false);
          setValidationMessage("Invalid or expired password reset link.");
          return;
        }
        
        addDebugLog(`[RESET PASSWORD] Session check result: ${JSON.stringify({
          hasSession: !!data.session,
          userId: data.session?.user?.id || 'none',
          userEmail: data.session?.user?.email || 'none'
        })}`);
        
        if (!data.session) {
          addDebugLog(`[RESET PASSWORD] No session found`);
          setIsValid(false);
          setValidationMessage("Invalid or expired password reset link.");
          return;
        }
        
        addDebugLog(`[RESET PASSWORD] Valid session found, enabling password reset form`);
        setIsValid(true);
      } catch (e: any) {
        addDebugLog(`[RESET PASSWORD] Unexpected error checking session: ${e.message}`);
        console.error("[ResetPassword] Unexpected error checking session:", e);
        setIsValid(false);
        setValidationMessage("An error occurred while validating your reset link.");
      }
    };
    
    checkSession();
  }, [emailParam, location.pathname, location.search]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      addDebugLog(`[RESET PASSWORD] User submitted new password form`);
      
      addDebugLog(`[RESET PASSWORD] Calling supabase.auth.updateUser to update password`);
      const { data, error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        addDebugLog(`[RESET PASSWORD] Error updating password: ${error.message}`);
        console.error("[ResetPassword] Error updating password:", error.message);
        throw error;
      }

      addDebugLog(`[RESET PASSWORD] Password updated successfully for user: ${data?.user?.id || 'unknown'}`);
      console.log("[ResetPassword] Password updated successfully");
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
      
      // Navigate to login page
      addDebugLog(`[RESET PASSWORD] Redirecting to login page after successful password update`);
      navigate("/login");
    } catch (error: any) {
      addDebugLog(`[RESET PASSWORD] Password update error: ${error.message}`);
      console.error("[ResetPassword] Error:", error);
      toast({
        title: "Password reset failed",
        description: error.message || "There was a problem resetting your password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSendResetEmail = async (values: z.infer<typeof standardResetSchema>) => {
    try {
      setIsLoading(true);
      addDebugLog(`[RESET PASSWORD] Sending password reset email to: ${values.email}`);
      
      // Test Supabase auth configuration
      addDebugLog(`[RESET PASSWORD] Testing Supabase auth configuration`);
      const { data: configData } = await supabase.auth.getSession();
      addDebugLog(`[RESET PASSWORD] Current user session status: ${!!configData.session ? 'Active' : 'None'}`);
      
      // Detailed logging before reset email request
      addDebugLog(`[RESET PASSWORD] Preparing to send reset email via Supabase`);
      addDebugLog(`[RESET PASSWORD] Redirect URL: ${window.location.origin}/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        addDebugLog(`[RESET PASSWORD] Error sending reset email: ${error.message}, ${JSON.stringify(error)}`);
        console.error("[ResetPassword] Error sending reset email:", error.message, error);
        throw error;
      }

      addDebugLog(`[RESET PASSWORD] Reset email request successful: ${JSON.stringify(data)}`);
      console.log("[ResetPassword] Reset email sent successfully");
      setShowResetEmailSentDialog(true);
    } catch (error: any) {
      addDebugLog(`[RESET PASSWORD] Error in reset email flow: ${error.message}`);
      console.error("[ResetPassword] Error:", error);
      
      // Display a user-friendly message even if there's an error
      // Don't reveal if the email exists in the system for security
      setShowResetEmailSentDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminResetSubmit = async (values: z.infer<typeof adminResetSchema>) => {
    try {
      setIsLoading(true);
      addDebugLog(`[RESET PASSWORD] Admin reset for email: ${values.email}`);
      
      // First try to find the user in the auth.users table via admin API
      addDebugLog(`[RESET PASSWORD] Calling admin.listUsers to find user`);
      const { data: userData, error: adminError } = await supabase.auth.admin.listUsers() as { 
        data: ListUsersResponse, 
        error: any 
      };
      
      if (adminError) {
        addDebugLog(`[RESET PASSWORD] Admin API access error: ${adminError.message}`);
        console.error("[ResetPassword] Admin API access error:", adminError.message);
        throw new Error("You don't have permission to perform admin actions. Make sure you're using the service role key.");
      }

      addDebugLog(`[RESET PASSWORD] Admin API returned ${userData?.users?.length || 0} users`);
      
      // Find the user with the matching email
      const userFound = userData.users.find(u => u.email === values.email);
      
      if (!userFound) {
        addDebugLog(`[RESET PASSWORD] User not found with email: ${values.email}`);
        console.error("[ResetPassword] User not found with email:", values.email);
        
        // Try alternative lookup through clients table as fallback
        addDebugLog(`[RESET PASSWORD] Attempting fallback lookup in clients table`);
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('client_email', values.email)
          .single();
        
        if (clientError || !clientData) {
          addDebugLog(`[RESET PASSWORD] Client lookup error: ${clientError?.message || 'No client found'}`);
          console.error("[ResetPassword] Client lookup error:", clientError?.message);
          throw new Error("User not found with this email address");
        }
        
        // If we found the user in clients table, update their password
        addDebugLog(`[RESET PASSWORD] Found client with ID: ${clientData.id}`);
        addDebugLog(`[RESET PASSWORD] Updating password for client via admin API`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          clientData.id,
          { password: values.password }
        );

        if (updateError) {
          addDebugLog(`[RESET PASSWORD] Error updating password: ${updateError.message}`);
          console.error("[ResetPassword] Error updating password:", updateError.message);
          throw updateError;
        }
        
        addDebugLog(`[RESET PASSWORD] Password successfully updated via client ID`);
      } else {
        // Update the user's password directly using admin API with the user ID from listUsers
        addDebugLog(`[RESET PASSWORD] Found user with ID: ${userFound.id}`);
        addDebugLog(`[RESET PASSWORD] Updating password for user via admin API`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userFound.id,
          { password: values.password }
        );

        if (updateError) {
          addDebugLog(`[RESET PASSWORD] Error updating password: ${updateError.message}`);
          console.error("[ResetPassword] Error updating password:", updateError.message);
          throw updateError;
        }
        
        addDebugLog(`[RESET PASSWORD] Password successfully updated via user ID`);
      }

      addDebugLog(`[RESET PASSWORD] Password reset successfully completed for: ${values.email}`);
      console.log("[ResetPassword] Password reset successfully for:", values.email);
      
      // Show success dialog
      setShowAdminSuccessDialog(true);
      
    } catch (error: any) {
      addDebugLog(`[RESET PASSWORD] Admin reset error: ${error.message}`);
      console.error("[ResetPassword] Error:", error);
      
      // Handle common errors
      let errorMessage = error.message || "There was a problem resetting the password";
      
      // Improve messaging for specific error types
      if (error.message.includes("User not found")) {
        errorMessage = "No account found with this email address";
      } else if (error.message.includes("permission")) {
        errorMessage = "You don't have permission to perform this action. Only administrators can reset passwords directly.";
      }
      
      toast({
        title: "Password reset failed",
        description: errorMessage,
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
          <CardTitle className="text-2xl font-bold text-center">
            {isAdminReset 
              ? "Direct Password Reset" 
              : isStandardReset 
                ? "Reset Password"
                : "Reset Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {isAdminReset 
              ? "Directly reset a user's password by email" 
              : isStandardReset
                ? "Enter your email to receive a password reset link"
                : "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Debug logs in dev mode */}
          {process.env.NODE_ENV === 'development' && debugLogs.length > 0 && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <p className="font-bold mb-1">Debug Logs:</p>
              {debugLogs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap mb-1">{log}</div>
              ))}
            </div>
          )}
          
          {!isValid && !isAdminReset && !isStandardReset ? (
            <div className="text-center p-4">
              <p className="text-red-500">{validationMessage}</p>
              <Button 
                onClick={() => navigate("/login")}
                className="mt-4"
              >
                Back to Login
              </Button>
            </div>
          ) : isAdminReset ? (
            <Form {...adminResetForm}>
              <form onSubmit={adminResetForm.handleSubmit(onAdminResetSubmit)} className="space-y-4">
                <FormField
                  control={adminResetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter user's email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminResetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          ) : isStandardReset ? (
            <Form {...standardResetForm}>
              <form onSubmit={standardResetForm.handleSubmit(onSendResetEmail)} className="space-y-4">
                <FormField
                  control={standardResetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                {/* Manual test button for development */}
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={async () => {
                      const email = standardResetForm.getValues().email;
                      if (!email) {
                        addDebugLog("[RESET PASSWORD] Test: No email provided");
                        return;
                      }
                      
                      addDebugLog(`[RESET PASSWORD] Test: Direct reset email to ${email}`);
                      try {
                        const { data, error } = await supabase.auth.resetPasswordForEmail(
                          email,
                          { redirectTo: `${window.location.origin}/reset-password` }
                        );
                        
                        if (error) {
                          addDebugLog(`[RESET PASSWORD] Test: Error: ${error.message}`);
                        } else {
                          addDebugLog(`[RESET PASSWORD] Test: Success: ${JSON.stringify(data)}`);
                        }
                      } catch (e: any) {
                        addDebugLog(`[RESET PASSWORD] Test: Exception: ${e.message}`);
                      }
                    }}
                  >
                    Test Direct Reset
                  </Button>
                )}
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/login")}
            className="text-sm"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>

      {/* Admin Reset Success Dialog */}
      <AlertDialog open={showAdminSuccessDialog} onOpenChange={setShowAdminSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Reset Successful</AlertDialogTitle>
            <AlertDialogDescription>
              The password for {adminResetForm.getValues().email} has been reset successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowAdminSuccessDialog(false);
              navigate("/login");
            }}>
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Email Sent Dialog */}
      <AlertDialog open={showResetEmailSentDialog} onOpenChange={setShowResetEmailSentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Reset Email Sent</AlertDialogTitle>
            <AlertDialogDescription>
              If an account exists with the email {standardResetForm.getValues().email}, you will receive a password reset link. Please check your email and follow the instructions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowResetEmailSentDialog(false);
              navigate("/login");
            }}>
              Return to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResetPassword;
