
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      { 
        url: window.location.href,
        origin: window.location.origin,
        search: location.search, 
        hash: location.hash 
      }
    );
  }, [location.pathname, location.search, location.hash]);

  // Determine if this might be a broken password reset link
  const isPossibleResetLink = 
    location.pathname.includes("verify") || 
    location.pathname.includes("reset") ||
    location.hash.includes("type=recovery") ||
    location.search.includes("type=recovery") ||
    location.hash.includes("access_token") ||
    location.search.includes("access_token");
    
  // Additional check for incorrect domain in reset links
  const hasTokenButWrongPath = 
    (location.hash.includes("access_token") || location.search.includes("access_token")) && 
    !location.pathname.includes("reset-password");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        
        {isPossibleResetLink && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <h2 className="flex items-center text-lg font-medium text-amber-800 mb-2">
              <Info size={20} className="mr-2" /> Password Reset Issue
            </h2>
            
            <p className="text-sm text-amber-700 mb-3">
              It looks like you might be trying to reset your password. There might be a configuration issue:
            </p>
            
            {hasTokenButWrongPath && (
              <p className="text-sm font-semibold text-amber-800 mb-3">
                This URL contains a reset token but is missing the correct path. Try changing the URL to:
                <br />
                <code className="block bg-amber-100 p-2 my-2 rounded overflow-auto text-xs">
                  {`${window.location.origin}/reset-password${window.location.search}${window.location.hash}`}
                </code>
              </p>
            )}
            
            <p className="text-sm text-amber-700 mb-3">
              <strong>For administrators:</strong> Ensure that:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 mb-3 pl-2">
              <li>Supabase Site URL is set to <code>https://ehr.valorwell.org</code> (with HTTPS)</li>
              <li>The redirect URL in Supabase includes <code>https://ehr.valorwell.org/reset-password</code></li>
              <li>The app's code is using the correct URL format for password reset links</li>
            </ul>
            
            <div className="mt-4 p-2 bg-amber-100 rounded text-sm">
              <p className="font-semibold">Current URL details:</p>
              <p className="text-xs overflow-auto">{window.location.href}</p>
            </div>
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
          
          {hasTokenButWrongPath && (
            <Button 
              variant="secondary"
              onClick={() => {
                window.location.href = `${window.location.origin}/reset-password${window.location.search}${window.location.hash}`;
              }}
              className="flex items-center justify-center"
            >
              Try to Fix Reset URL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
