import { useState } from "react";
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
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      console.log("[ForgotPassword] Password reset attempt for email:", values.email);
      
      // Get the current URL to construct reset URL (without query parameters)
      const baseUrl = window.location.origin;
      const resetUrl = `${baseUrl}/reset-password`;
      
      // Call our custom edge function to handle the reset email
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email: values.email,
          resetUrl: resetUrl
        }
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      toast({
        title: "Check your email",
        description: "If your email is registered, you will receive a password reset link shortly.",
      });
    } catch (error: any) {
      console.error("[ForgotPassword] Error:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {!isSubmitted ? (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Reset your password</h2>
            <p className="text-gray-500 mt-2">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email" 
                        autoComplete="email"
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
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
              <div className="text-center mt-4">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => window.history.back()}
                >
                  Back to login
                </Button>
              </div>
            </form>
          </Form>
        </>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-gray-500 mb-6">
            If your email address is registered with us, you'll receive a password reset link shortly.
          </p>
          <Button onClick={() => window.location.href = "/login"}>
            Return to login
          </Button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
