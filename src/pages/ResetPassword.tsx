
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
    // If no hash but email parameter exists, show standard reset form
    if (emailParam && !window.location.hash) {
      setIsStandardReset(true);
      setIsAdminReset(false);
      setIsValid(false);
      return;
    }
    
    // If no hash and no email, show admin reset form
    if (!window.location.hash && !emailParam) {
      setIsAdminReset(true);
      setIsStandardReset(false);
      setIsValid(false);
      return;
    }

    // Check if we have hash parameters for the password reset
    const hash = window.location.hash;
    if (!hash) {
      setIsValid(false);
      setValidationMessage("Invalid or expired password reset link.");
      return;
    }

    // Supabase automatically handles the hash fragment from a password reset link
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[ResetPassword] Error checking session:", error.message);
        setIsValid(false);
        setValidationMessage("Invalid or expired password reset link.");
        return;
      }
      
      if (!data.session) {
        setIsValid(false);
        setValidationMessage("Invalid or expired password reset link.");
        return;
      }
      
      setIsValid(true);
    };
    
    checkSession();
  }, [emailParam]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      console.log("[ResetPassword] Updating password");
      
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error("[ResetPassword] Error updating password:", error.message);
        throw error;
      }

      console.log("[ResetPassword] Password updated successfully");
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
      
      // Navigate to login page
      navigate("/login");
    } catch (error: any) {
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
      console.log("[ResetPassword] Sending password reset email to:", values.email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("[ResetPassword] Error sending reset email:", error.message);
        throw error;
      }

      console.log("[ResetPassword] Reset email sent successfully");
      setShowResetEmailSentDialog(true);
    } catch (error: any) {
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
      console.log("[ResetPassword] Admin resetting password for:", values.email);
      
      // First try to find the user in the auth.users table via admin API
      // We need to use the service role key for this which is automatically used by the admin endpoints
      const { data: userData, error: adminError } = await supabase.auth.admin.listUsers();
      
      if (adminError) {
        console.error("[ResetPassword] Admin API access error:", adminError.message);
        throw new Error("You don't have permission to perform admin actions. Make sure you're using the service role key.");
      }

      // Find the user with the matching email
      const userFound = userData.users.find(u => u.email === values.email);
      
      if (!userFound) {
        console.error("[ResetPassword] User not found with email:", values.email);
        
        // Try alternative lookup through clients table as fallback
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('client_email', values.email)
          .single();
        
        if (clientError || !clientData) {
          console.error("[ResetPassword] Client lookup error:", clientError?.message);
          throw new Error("User not found with this email address");
        }
        
        // If we found the user in clients table, update their password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          clientData.id,
          { password: values.password }
        );

        if (updateError) {
          console.error("[ResetPassword] Error updating password:", updateError.message);
          throw updateError;
        }
      } else {
        // Update the user's password directly using admin API with the user ID from listUsers
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userFound.id,
          { password: values.password }
        );

        if (updateError) {
          console.error("[ResetPassword] Error updating password:", updateError.message);
          throw updateError;
        }
      }

      console.log("[ResetPassword] Password reset successfully for:", values.email);
      
      // Show success dialog
      setShowAdminSuccessDialog(true);
      
    } catch (error: any) {
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
