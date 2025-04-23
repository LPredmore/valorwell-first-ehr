
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/packages/auth/contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  blockNewClients?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles = [], blockNewClients = false }: ProtectedRouteProps) => {
  const { userRole, isLoading, isAuthenticated } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
