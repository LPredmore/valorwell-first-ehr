import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@valorwell/core/api/supabase";
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

const formSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL hash fragment or query parameters
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    let accessToken = null;
    
    if (hash.includes("access_token=")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      accessToken = hashParams.get("access_token");
    } else if (searchParams.has("token")) {
      accessToken = searchParams.get("token");
    }
    
    setToken(accessToken);
    
    if (!accessToken) {
      toast({
        title: "Invalid or missing reset token",
        description: "The password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      toast({
        title: "Invalid reset link",
        description: "The password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password: values.password 
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated successfully",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      
      // Redirect to login page after successful password reset
      navigate("/login");
    } catch (error: any) {
      console.error("[ResetPassword] Error:", error);
      toast({
        title: "Failed to reset password",
        description: error.message || "Something went wrong. Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
        <p className="text-gray-500 mb-6">
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        <Button onClick={() => navigate("/forgot-password")}>
          Request new reset link
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Set new password</h2>
        <p className="text-gray-500 mt-2">
          Please create a new password for your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter new password" 
                    autoComplete="new-password"
                    {...field} 
                  />
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
                  <Input 
                    type="password" 
                    placeholder="Confirm new password" 
                    autoComplete="new-password"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Resetting password..." : "Reset password"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ResetPassword;
