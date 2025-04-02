
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const Index = () => {
  const navigate = useNavigate();
  const { userRole, isLoading, session } = useUser();

  useEffect(() => {
    // Only redirect if auth is not loading and we have a session
    if (!isLoading && session) {
      console.log('User authenticated, redirecting based on role:', userRole);
      
      if (userRole === 'clinician') {
        // Redirect clinicians to their dashboard instead of Calendar
        navigate('/clinician-dashboard');
      } else if (userRole === 'client') {
        // Redirect clients to their dashboard
        navigate('/patient-dashboard');
      } else {
        // Redirect admins/moderators to Calendar page (default behavior)
        navigate('/calendar');
      }
    }
  }, [navigate, userRole, isLoading, session]);

  // Show loading indicator while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600"></div>
      </div>
    );
  }

  // Return null if not loading and not authenticated (Layout will handle redirect to login)
  return null;
};

export default Index;
