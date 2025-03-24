
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to Calendar
        navigate('/calendar');
      } else {
        // If user is not authenticated, redirect to Auth
        navigate('/auth');
      }
    }
  }, [navigate, user, loading]);

  // Display a loading state while checking auth
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return null;
};

export default Index;
