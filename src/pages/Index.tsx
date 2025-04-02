
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const Index = () => {
  const navigate = useNavigate();
  const { userRole, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (userRole === 'clinician') {
        // Redirect clinicians to Calendar page
        navigate('/calendar');
      } else if (userRole === 'client') {
        // Redirect clients to their dashboard
        navigate('/patient-dashboard');
      } else {
        // Redirect admins/moderators to Calendar page (default behavior)
        navigate('/calendar');
      }
    }
  }, [navigate, userRole, isLoading]);

  return null;
};

export default Index;
