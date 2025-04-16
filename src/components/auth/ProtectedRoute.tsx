
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { userRole, clientStatus, isLoading, userId } = useUser();
  const { clinicianId, clientId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (clinicianId || clientId) {
        setIsCheckingUser(true);
        try {
          console.log("[ProtectedRoute] Checking user for clinician/client route");
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            console.log("[ProtectedRoute] User ID from route check:", data.user.id);
            setCurrentUserId(data.user.id);
          }
        } catch (error) {
          console.error("[ProtectedRoute] Error getting user:", error);
        } finally {
          setIsCheckingUser(false);
        }
      }
    };
    
    getCurrentUserId();
  }, [clinicianId, clientId]);
  
  // Additional auth check if context is not sufficient
  useEffect(() => {
    const verifyAuth = async () => {
      if (!userId && !isLoading) {
        setIsCheckingUser(true);
        try {
          console.log("[ProtectedRoute] Performing additional auth check");
          const { data } = await supabase.auth.getUser();
          if (!data?.user) {
            console.log("[ProtectedRoute] No authenticated user found");
            setAuthChecked(true);
          } else {
            console.log("[ProtectedRoute] User authenticated:", data.user.id);
            // User is authenticated but context didn't load properly
            // Let's wait a bit longer for context or redirect
            setTimeout(() => {
              setAuthChecked(true);
            }, 500);
          }
        } catch (error) {
          console.error("[ProtectedRoute] Error in verifyAuth:", error);
          setAuthChecked(true);
        } finally {
          setIsCheckingUser(false);
        }
      } else {
        setAuthChecked(true);
      }
    };

    // Wait a short time for context to load before verifying manually
    const timer = setTimeout(verifyAuth, 300);
    return () => clearTimeout(timer);
  }, [userId, isLoading]);
  
  if (isLoading || isCheckingUser || !authChecked) {
    console.log("[ProtectedRoute] Loading state:", { 
      isLoading, 
      isCheckingUser, 
      authChecked,
      userRole,
      clientStatus
    });
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600"></div>
      </div>
    );
  }
  
  console.log("[ProtectedRoute] Auth check complete:", { 
    userRole, 
    clientStatus, 
    allowedRoles, 
    blockNewClients 
  });
  
  // First check role-based access
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log("[ProtectedRoute] Access denied: role not allowed");
    
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
    console.log("[ProtectedRoute] Redirecting new client to profile setup");
    return <Navigate to="/profile-setup" replace />;
  }
  
  // Allow access to the protected route
  console.log("[ProtectedRoute] Access granted to protected route with role:", userRole);
  return <>{children}</>;
};

export default ProtectedRoute;
