
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
  FileText,
  UserPlus,
  UserCog,
  UserSearch
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { userRole, clientStatus, isLoading } = useUser();
  const isClient = userRole === 'client';
  const isClinician = userRole === 'clinician';
  const isNewClient = isClient && clientStatus === 'New';
  
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
        {/* Sign-Up link - hide for clinicians */}
        {!isClinician && (
          <Link 
            to="/signup" 
            className={`sidebar-link ${isActive('/signup') ? 'active' : ''}`}
          >
            <UserPlus size={18} />
            <span>Sign-Up</span>
          </Link>
        )}

        {/* Profile setup - hide for clinicians */}
        {!isClinician && (
          <Link 
            to="/profile-setup" 
            className={`sidebar-link ${isActive('/profile-setup') ? 'active' : ''}`}
          >
            <UserCog size={18} />
            <span>Profile Setup</span>
          </Link>
        )}
        
        {/* Links only visible to non-new clients */}
        {isClient && !isNewClient && (
          <>
            <Link 
              to="/therapist-selection" 
              className={`sidebar-link ${isActive('/therapist-selection') ? 'active' : ''}`}
            >
              <UserSearch size={18} />
              <span>Therapist Selection</span>
            </Link>

            <Link 
              to="/patient-dashboard" 
              className={`sidebar-link ${isActive('/patient-dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Patient Dashboard</span>
            </Link>
            
            <Link 
              to="/patient-documents" 
              className={`sidebar-link ${isActive('/patient-documents') ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>Patient Documents</span>
            </Link>
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
