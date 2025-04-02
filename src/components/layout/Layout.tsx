
import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading: userContextLoading } = useUser();

  useEffect(() => {
    console.log("[Layout] Initializing layout, userContextLoading:", userContextLoading);
    
    const checkSession = async () => {
      try {
        console.log("[Layout] Checking session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Layout] Error checking session:", error);
          return;
        }
        
        console.log("[Layout] Session check result:", data.session ? "Session exists" : "No session");
        setSession(data.session);
        
        // Set up auth state listener
        console.log("[Layout] Setting up layout auth state listener");
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log("[Layout] Auth state change in layout:", event);
            
            if (event === 'SIGNED_OUT') {
              console.log("[Layout] User signed out, redirecting to login");
              setSession(null);
              navigate('/login');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              console.log("[Layout] User signed in or token refreshed");
              setSession(newSession);
            }
          }
        );
        
        // Cleanup subscription on unmount
        return () => {
          console.log("[Layout] Cleaning up layout auth listener");
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error("[Layout] Exception in checkSession:", error);
      }
    };
    
    checkSession();
  }, [navigate, userContextLoading]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
