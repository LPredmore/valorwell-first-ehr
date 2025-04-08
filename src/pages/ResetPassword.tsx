
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidLink, setIsValidLink] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Check multiple sources for recovery tokens
    const checkForRecoveryToken = async () => {
      console.log("Checking for recovery token...");
      console.log("Current URL:", window.location.href);
      
      try {
        // Check in hash params
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        
        // Check in search params
        const query = new URLSearchParams(location.search);
        
        // Check various potential token locations
        const isRecovery = 
          (hash && (hash.includes("type=recovery") || hashParams.get("type") === "recovery")) || 
          (query.get("type") === "recovery");

        // Also check if we have an access token which would indicate a valid reset link
        const hasAccessToken = 
          hashParams.get("access_token") || 
          query.get("access_token");

        console.log("Is recovery:", isRecovery);
        console.log("Has access token:", !!hasAccessToken);

        if (isRecovery || hasAccessToken) {
          console.log("Valid reset link detected");
          
          // If we have an access token in the URL, we can try to verify it
          if (hasAccessToken) {
            // The token is already applied to the current session automatically
            // by Supabase client when it detects it in the URL
            console.log("Access token found in URL, checking session...");
            
            // Verify the session is valid
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error verifying session:", error);
              throw error;
            }
            
            if (data?.session) {
              console.log("Valid session detected");
              setIsValidLink(true);
            } else {
              console.error("No valid session found");
              setIsValidLink(false);
            }
          } else {
            // If we don't have an access token but it's a recovery link,
            // we'll assume it's valid for now
            setIsValidLink(true);
          }
        } else {
          console.error("Invalid reset link detected");
          toast({
            title: "Invalid reset link",
            description: "This doesn't appear to be a valid password reset link.",
            variant: "destructive",
          });
          setIsValidLink(false);
        }
      } catch (err) {
        console.error("Error checking recovery token:", err);
        toast({
          title: "Error",
          description: "There was a problem validating your reset link. Please try again.",
          variant: "destructive",
        });
        setIsValidLink(false);
      } finally {
        setTokenChecked(true);
      }
    };

    checkForRecoveryToken();
  }, [location.search, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Update the password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated successfully",
        description: "Your password has been reset. You can now log in with your new password.",
      });

      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(err.message || "Failed to reset password. Please try again.");
      toast({
        title: "Error",
        description: err.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Create a new password for your account</CardDescription>
        </CardHeader>
        {!tokenChecked ? (
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                Validating your password reset link...
              </p>
            </div>
          </CardContent>
        ) : isValidLink ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⟳</span> Resetting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <KeyRound className="mr-2" size={16} /> Reset Password
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="mr-2" size={16} /> Back to Login
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h2 className="text-lg font-medium text-amber-800 mb-2">Invalid Password Reset Link</h2>
              <p className="text-sm text-amber-700">
                The password reset link appears to be invalid or has expired. 
                Please request a new password reset link from the login page.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              className="w-full mt-4"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="mr-2" size={16} /> Go to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
