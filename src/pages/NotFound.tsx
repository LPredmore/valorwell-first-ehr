
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        
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
