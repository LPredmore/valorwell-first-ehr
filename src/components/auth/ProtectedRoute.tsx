
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { userRole, isLoading } = useUser();
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600"></div>
    </div>;
  }
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/patient-dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
