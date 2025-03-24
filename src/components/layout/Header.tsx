
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="h-16 px-6 flex items-center justify-between">
        <h2 className="text-lg font-medium">ValorWell Hub</h2>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
