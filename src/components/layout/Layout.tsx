
import { ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading: userContextLoading, userId, authInitialized } = useUser();

  // Effect to handle redirects based on authentication status
  useEffect(() => {
    console.log("[Layout] Initializing layout, userContextLoading:", userContextLoading, "authInitialized:", authInitialized);
    
    if (authInitialized) {
      if (!userId) {
        console.log("[Layout] No authenticated user found, redirecting to login");
        navigate('/login');
      }
    }
  }, [navigate, userContextLoading, userId, authInitialized]);

  // Show loading state while checking auth
  if (userContextLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorwell-600"></div>
      </div>
    );
  }

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
