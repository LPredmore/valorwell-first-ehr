
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
  const { userRole, clientStatus, isLoading, authInitialized } = useUser();
  const { clinicianId, clientId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (clinicianId || clientId) {
        setIsCheckingUser(true);
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setCurrentUserId(data.user.id);
        }
        setIsCheckingUser(false);
      }
    };
    
    getCurrentUserId();
  }, [clinicianId, clientId]);
  
  // Log the current state for debugging
  console.log(`[ProtectedRoute] Status: isLoading=${isLoading}, authInitialized=${authInitialized}, userRole=${userRole}, clientStatus=${clientStatus}, blockNewClients=${blockNewClients}`);
  
  // Wait for UserContext to be fully initialized before making routing decisions
  if (isLoading || !authInitialized || isCheckingUser) {
    console.log("[ProtectedRoute] Waiting for UserContext to initialize fully before making redirect decision");
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600"></div>
    </div>;
  }
  
  // First check role-based access
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log(`[ProtectedRoute] User role '${userRole}' not in allowed roles: [${allowedRoles.join(', ')}]`);
    
    // Admin can access all routes
    if (userRole === 'admin') {
      console.log("[ProtectedRoute] Admin override - allowing access");
      return <>{children}</>;
    }
    // Redirect clinicians to Calendar page
    else if (userRole === 'clinician') {
      console.log("[ProtectedRoute] Redirecting clinician to Calendar");
      return <Navigate to="/calendar" replace />;
    }
    // Redirect clients to patient dashboard
    else if (userRole === 'client') {
      console.log("[ProtectedRoute] Redirecting client to patient dashboard");
      return <Navigate to="/patient-dashboard" replace />;
    }
    // Redirect everyone else to login
    else {
      console.log("[ProtectedRoute] No valid role, redirecting to login");
      return <Navigate to="/login" replace />;
    }
  }
  
  // For clients, check if they're "New" and should be blocked from this route
  if (userRole === 'client' && blockNewClients && clientStatus === 'New') {
    console.log("[ProtectedRoute] Blocking new client, redirecting to profile setup");
    return <Navigate to="/profile-setup" replace />;
  }
  
  // Allow access to the protected route
  console.log(`[ProtectedRoute] Access granted to protected route with role: ${userRole}`);
  return <>{children}</>;
};

export default ProtectedRoute;
