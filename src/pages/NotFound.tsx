
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Determine if this might be a broken password reset link
  const isPossibleResetLink = location.pathname.includes("verify") || 
                              location.pathname.includes("reset") ||
                              location.hash.includes("type=recovery");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-6">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        
        {isPossibleResetLink && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <h2 className="text-lg font-medium text-amber-800 mb-2">Broken Password Reset Link?</h2>
            <p className="text-sm text-amber-700 mb-3">
              It looks like you might be trying to reset your password. The link might be expired or invalid.
            </p>
            <p className="text-sm text-amber-700">
              Please try to reset your password again or contact support for assistance.
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <Button asChild variant="default">
            <Link to="/" className="flex items-center justify-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link to="/login" className="flex items-center justify-center">
              Go to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
