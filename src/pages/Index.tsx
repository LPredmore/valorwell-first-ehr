
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const Index = () => {
  const navigate = useNavigate();
  const { userRole, isLoading } = useUser();

  useEffect(() => {
    console.log("[Index] Index page mounted, isLoading:", isLoading, "userRole:", userRole);
    
    if (!isLoading) {
      console.log("[Index] User context loaded, determining redirect");
      
      if (userRole === 'clinician') {
        console.log("[Index] Redirecting clinician to Calendar page");
        navigate('/calendar');
      } else if (userRole === 'client') {
        console.log("[Index] Redirecting client to Patient Dashboard");
        navigate('/patient-dashboard');
      } else {
        console.log("[Index] Redirecting other role to Calendar page (default)");
        navigate('/calendar');
      }
    } else {
      console.log("[Index] Still loading user data, waiting before redirect");
    }
  }, [navigate, userRole, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isLoading ? (
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
