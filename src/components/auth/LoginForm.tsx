
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormProps = {
  onForgotPassword: () => void;
};

const LoginForm = ({ onForgotPassword }: LoginFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("[LoginForm] Login attempt started for email:", values.email);
    try {
      setIsLoading(true);
      console.log("[LoginForm] Calling supabase.auth.signInWithPassword");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("[LoginForm] Authentication error:", error.message);
        throw error;
      }

      console.log("[LoginForm] Authentication successful, user:", data.user?.id);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      console.log("[LoginForm] Navigating to home page");
      // Wait a short time to ensure auth state is updated before navigation
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error: any) {
      console.error("[LoginForm] Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "There was a problem signing in",
        variant: "destructive",
      });
    } finally {
      console.log("[LoginForm] Setting isLoading to false");
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-right">
          <button 
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
