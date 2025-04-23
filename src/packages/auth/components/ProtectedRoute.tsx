import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  blockNewClients?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  blockNewClients = false
}) => {
  const { userRole, isLoading, userId } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Additional check to block "new" clients
  if (blockNewClients && userRole === 'client') {
    // Check if the user has a client status of "new"
    // You'll need to adjust this part based on how you store the client status
    const clientStatus = localStorage.getItem('clientStatus'); // Example: Fetch from local storage

    if (clientStatus === 'new') {
      return <Navigate to="/profile-setup" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
