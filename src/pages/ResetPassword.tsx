
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const [email, setEmail] = useState(emailParam || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ResetPassword] Starting password reset for email:", email);
    
    try {
      setIsLoading(true);
      
      // Use the origin to build the proper redirect URL
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/update-password`;
      
      console.log("[ResetPassword] Using redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      
      if (error) {
        console.error("[ResetPassword] Error:", error.message);
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });
    } catch (error: any) {
      console.error("[ResetPassword] Error details:", error);
      toast({
        title: "Failed to send reset email",
        description: error.message || "There was a problem sending the reset email. Please try again.",
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
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
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
