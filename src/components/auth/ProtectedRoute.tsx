
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

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
  
  if (isLoading) {
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
