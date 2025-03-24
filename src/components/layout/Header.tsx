
import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  userName = 'Dr. Johnson',
  userAvatar 
}) => {
  const location = useLocation();
  const path = location.pathname.substring(1);
  const title = path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';

  // Get current time to display greeting
  const hours = new Date().getHours();
  let greeting = 'Good morning';
  if (hours >= 12 && hours < 17) {
    greeting = 'Good afternoon';
  } else if (hours >= 17) {
    greeting = 'Good evening';
  }

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      
      <div className="relative flex-1 max-w-lg mx-8">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
        <input 
          type="search" 
          className="w-full p-2 pl-10 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-300 focus:ring-1 focus:outline-none focus:ring-valorwell-500"
          placeholder="Search..." 
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">{greeting},</p>
            <p className="text-sm font-medium text-valorwell-700">{userName}</p>
          </div>
          <div className="w-10 h-10 bg-valorwell-700 rounded-full flex items-center justify-center text-white">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <span>JN</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
