
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

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsResettingPassword(true);
      console.log("[PasswordResetForm] Starting password reset flow for email:", values.email);
      
      // Use the origin to build the proper redirect URL
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/update-password`;
      
      console.log("[PasswordResetForm] Using redirect URL:", redirectTo);
      
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectTo,
      });
      
      if (resetError) {
        console.error("[PasswordResetForm] Direct reset error:", resetError.message, resetError);
        throw resetError;
      } else {
        console.log("[PasswordResetForm] Direct reset response:", resetData);
      }
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });

      onCancel();
      resetForm.reset();
    } catch (error: any) {
      console.error("[PasswordResetForm] Unexpected error:", error);
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
