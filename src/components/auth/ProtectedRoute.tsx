
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  blockNewClients?: boolean; // New prop to block "New" clients
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  blockNewClients = false
}) => {
  const { userRole, clientStatus, isLoading } = useUser();
  const { clinicianId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (clinicianId) {
        setIsCheckingUser(true);
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setCurrentUserId(data.user.id);
        }
        setIsCheckingUser(false);
      }
    };
    
    getCurrentUserId();
  }, [clinicianId]);
  
  if (isLoading || isCheckingUser) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600"></div>
    </div>;
  }
  
  // First check role-based access
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect clinicians to Calendar page
    if (userRole === 'clinician') {
      return <Navigate to="/calendar" replace />;
    }
    // Redirect clients to patient dashboard
    else if (userRole === 'client') {
      return <Navigate to="/patient-dashboard" replace />;
    }
    // Redirect everyone else to login
    else {
      return <Navigate to="/login" replace />;
    }
  }
  
  // For clients, check if they're "New" and should be blocked from this route
  if (userRole === 'client' && blockNewClients && clientStatus === 'New') {
    return <Navigate to="/profile-setup" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
