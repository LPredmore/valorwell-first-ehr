
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
import {
  DialogFooter
} from "@/components/ui/dialog";

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type PasswordResetFormProps = {
  onCancel: () => void;
};

const PasswordResetForm = ({ onCancel }: PasswordResetFormProps) => {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Helper function for debugging auth operations
  const debugAuthOperation = async (operation: string, fn: () => Promise<any>) => {
    console.log(`[DEBUG][${operation}] Starting operation`);
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[DEBUG][${operation}] Completed in ${duration}ms with result:`, result);
      return result;
    } catch (error: any) {
      const duration = (performance.now() - startTime).toFixed(2);
      console.error(`[DEBUG][${operation}] Failed after ${duration}ms with error:`, error);
      throw error;
    }
  };

  const handleResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    setResetError(null);
    
    // Set a timeout to clear the loading state in case the operation hangs
    const timeoutId = setTimeout(() => {
      console.warn("[PasswordResetForm] Reset password operation timed out after 15 seconds");
      setIsResettingPassword(false);
      setResetError("The request timed out. Please try again.");
      toast({
        title: "Request timed out",
        description: "The password reset request took too long. Please try again.",
        variant: "destructive",
      });
    }, 15000);
    
    try {
      setIsResettingPassword(true);
      console.log("[PasswordResetForm] Starting password reset flow for email:", values.email);
      
      // Use the origin to build the proper redirect URL
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/update-password`;
      
      console.log("[PasswordResetForm] Using redirect URL:", redirectTo);
      
      const { error: resetError } = await debugAuthOperation("resetPasswordForEmail", () =>
        supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: redirectTo,
        })
      );
      
      // Clear the timeout since the operation completed
      clearTimeout(timeoutId);
      
      if (resetError) {
        console.error("[PasswordResetForm] Reset error:", resetError.message, resetError);
        setResetError(resetError.message);
        throw resetError;
      }
      
      console.log("[PasswordResetForm] Password reset email sent successfully");
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });

      onCancel();
      resetForm.reset();
    } catch (error: any) {
      console.error("[PasswordResetForm] Unexpected error:", error);
      // Clear the timeout if there's an error
      clearTimeout(timeoutId);
      
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to initiate password reset",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <Form {...resetForm}>
      <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
        <FormField
          control={resetForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Display reset error if present */}
        {resetError && (
          <p className="text-sm text-red-500">{resetError}</p>
        )}
        
        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isResettingPassword}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isResettingPassword}>
            {isResettingPassword ? "Processing..." : "Continue"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PasswordResetForm;
