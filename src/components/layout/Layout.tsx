
import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          return;
        }
        
        setSession(data.session);
        
        // Set up auth state listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (event === 'SIGNED_OUT') {
              setSession(null);
              navigate('/login');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setSession(newSession);
            }
          }
        );
        
        // Cleanup subscription on unmount
        return () => {
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error("Exception in checkSession:", error);
      }
    };
    
    checkSession();
  }, [navigate]);

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
