
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const Index = () => {
  const navigate = useNavigate();
  const { userRole, isLoading, authInitialized, clientStatus } = useUser();

  useEffect(() => {
    console.log("[Index] Index page mounted, isLoading:", isLoading, "userRole:", userRole, "authInitialized:", authInitialized, "clientStatus:", clientStatus);
    
    // Only make redirect decisions if the UserContext is fully initialized
    if (authInitialized && !isLoading) {
      console.log("[Index] User context fully initialized, determining redirect");
      
      // Track whether we've redirected to prevent multiple redirects
      let redirected = false;
      
      if (userRole === 'admin') {
        console.log("[Index] Redirecting admin to Settings page");
        navigate('/settings');
        redirected = true;
      } else if (userRole === 'clinician') {
        console.log("[Index] Redirecting clinician to Dashboard page");
        navigate('/clinician-dashboard');
        redirected = true;
      } else if (userRole === 'client') {
        // For clients, check their status
        if (clientStatus === 'New') {
          console.log("[Index] Redirecting new client to Profile Setup");
          navigate('/profile-setup');
          redirected = true;
        } else {
          console.log("[Index] Redirecting client to Patient Dashboard");
          navigate('/patient-dashboard');
          redirected = true;
        }
      } 
      
      // Only redirect to login if not loading, auth is initialized AND no valid role was found
      if (!redirected && !userRole) {
        console.log("[Index] No valid role found, redirecting to Login page");
        navigate('/login');
      }
    } else {
      console.log("[Index] Waiting for user context to fully initialize before redirecting");
    }
  }, [navigate, userRole, isLoading, authInitialized, clientStatus]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isLoading || !authInitialized ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Index;
