
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  BarChart2, 
  Activity, 
  Settings, 
  Bell, 
  MessageSquare,
  ChevronLeft,
  UserCheck,
  LayoutDashboard,
  UserSearch,
  User
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { userRole, clientStatus, isLoading, userId } = useUser();
  const isClient = userRole === 'client';
  const isClinician = userRole === 'clinician';
  const isNewClient = isClient && clientStatus === 'New';
  const [clinicianId, setClinicianId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setClinicianId(data.user.id);
      }
    };
    
    if (isClinician || userRole === 'admin' || userRole === 'moderator') {
      fetchUserId();
    }
  }, [isClinician, userRole]);
  
  const isActive = (path: string) => {
    return currentPath === path;
  };

  if (isLoading) {
    return (
      <div className="w-[220px] min-h-screen border-r bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-valorwell-600"></div>
      </div>
    );
  }

  return (
    <div className="w-[220px] min-h-screen border-r bg-white flex flex-col">
      <div className="p-4 flex items-center gap-2 border-b">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/47fe3428-4c8d-48fd-9f59-8040e817c9a8.png" 
            alt="ValorWell" 
            className="h-8 w-8" 
          />
          <span className="text-xl font-semibold text-valorwell-700">ValorWell</span>
        </Link>
        <button className="ml-auto text-gray-500">
          <ChevronLeft size={18} />
        </button>
      </div>
      
      <nav className="flex-1 py-4 space-y-1 px-2">
        {/* Links only visible to non-new clients */}
        {isClient && !isNewClient && (
          <>
            <Link 
              to="/patient-dashboard" 
              className={`sidebar-link ${isActive('/patient-dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Patient Dashboard</span>
            </Link>
            
            <Link 
              to="/therapist-selection" 
              className={`sidebar-link ${isActive('/therapist-selection') ? 'active' : ''}`}
            >
              <UserSearch size={18} />
              <span>Therapist Selection</span>
            </Link>
            
            {/* Remove Patient Profile link for client role users */}
            {userId && !isClient && (
              <Link 
                to={`/clients/${userId}`} 
                className={`sidebar-link ${isActive(`/clients/${userId}`) ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Patient Profile</span>
              </Link>
            )}
          </>
        )}
        
        {/* Clinician only links */}
        {isClinician && (
          <>
            <Link 
              to="/clinician-dashboard" 
              className={`sidebar-link ${isActive('/clinician-dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            
            {clinicianId && (
              <Link 
                to={`/clinicians/${clinicianId}`} 
                className={`sidebar-link ${isActive(`/clinicians/${clinicianId}`) ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Profile</span>
              </Link>
            )}
            
            <Link 
              to="/my-clients" 
              className={`sidebar-link ${isActive('/my-clients') ? 'active' : ''}`}
            >
              <UserCheck size={18} />
              <span>My Clients</span>
            </Link>
            
            <Link 
              to="/calendar" 
              className={`sidebar-link ${isActive('/calendar') ? 'active' : ''}`}
            >
              <Calendar size={18} />
              <span>Calendar</span>
            </Link>
          </>
        )}
        
        {/* Admin/Staff only links - exclude clinicians */}
        {userRole === 'admin' || userRole === 'moderator' ? (
          <>
            <Link 
              to="/clinician-dashboard" 
              className={`sidebar-link ${isActive('/clinician-dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            
            {clinicianId && (
              <Link 
                to={`/clinicians/${clinicianId}`} 
                className={`sidebar-link ${isActive(`/clinicians/${clinicianId}`) ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Profile</span>
              </Link>
            )}
            
            <Link 
              to="/my-clients" 
              className={`sidebar-link ${isActive('/my-clients') ? 'active' : ''}`}
            >
              <UserCheck size={18} />
              <span>My Clients</span>
            </Link>
            
            <Link 
              to="/calendar" 
              className={`sidebar-link ${isActive('/calendar') ? 'active' : ''}`}
            >
              <Calendar size={18} />
              <span>Calendar</span>
            </Link>
            
            <Link 
              to="/clients" 
              className={`sidebar-link ${isActive('/clients') ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Clients</span>
            </Link>
            
            <Link 
              to="/analytics" 
              className={`sidebar-link ${isActive('/analytics') ? 'active' : ''}`}
            >
              <BarChart2 size={18} />
              <span>Analytics</span>
            </Link>
            
            <Link 
              to="/activity" 
              className={`sidebar-link ${isActive('/activity') ? 'active' : ''}`}
            >
              <Activity size={18} />
              <span>Activity</span>
            </Link>
            
            <Link 
              to="/settings" 
              className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          </>
        ) : null}
      </nav>
      
      <div className="border-t py-4 space-y-1 px-2">
        {/* Only show these links for admin/moderator roles */}
        {(userRole === 'admin' || userRole === 'moderator') && (
          <>
            <Link 
              to="/reminders" 
              className={`sidebar-link ${isActive('/reminders') ? 'active' : ''}`}
            >
              <Bell size={18} />
              <span>Reminders</span>
            </Link>
            
            <Link 
              to="/messages" 
              className={`sidebar-link ${isActive('/messages') ? 'active' : ''}`}
            >
              <MessageSquare size={18} />
              <span>Messages</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
