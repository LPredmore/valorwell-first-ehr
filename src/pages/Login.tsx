
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useUser } from "@/context/UserContext";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { userRole, isLoading: userContextLoading } = useUser();
  
  // Check if user is already logged in
  useEffect(() => {
    if (userRole && !userContextLoading) {
      console.log("[Login] User already authenticated, redirecting to home");
      navigate("/");
    }
  }, [userRole, userContextLoading, navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("[Login] Login attempt started for email:", values.email);
    try {
      setIsLoading(true);
      console.log("[Login] Calling supabase.auth.signInWithPassword");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("[Login] Authentication error:", error.message);
        throw error;
      }

      console.log("[Login] Authentication successful, user:", data.user?.id);
      
      // After successful login, clear the temporary password if it exists
      if (data.user) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('client_temppassword')
          .eq('id', data.user.id)
          .maybeSingle();

        if (clientData?.client_temppassword) {
          // Clear the temporary password
          await supabase
            .from('clients')
            .update({ client_temppassword: null })
            .eq('id', data.user.id);
          
          toast({
            title: "Welcome!",
            description: "Your account has been set up successfully. You may want to change your password in settings.",
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
        }
      }
      
      // Let the UserContext handle the navigation through its useEffect
      console.log("[Login] Authentication complete - letting UserContext redirect");
    } catch (error: any) {
      console.error("[Login] Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "There was a problem signing in",
        variant: "destructive",
      });
    } finally {
      console.log("[Login] Setting isLoading to false");
      setIsLoading(false);
    }
  };

  // If user context is still loading, show loading state
  if (userContextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in (userRole is null), show login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <div className="flex justify-end">
                <Button
                  variant="link"
                  type="button"
                  className="px-0 font-normal text-sm"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-center text-sm text-gray-500 mt-2">
            Don't have an account?{" "}
            <button 
              onClick={() => navigate("/signup")} 
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
