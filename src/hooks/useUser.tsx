
import { useUserContext } from '@/context/UserContext';

export function useUser() {
  const { user, isLoading, error, refreshUser } = useUserContext();
  
  return {
    user,
    userId: user?.id || null,
    isLoading,
    error,
    refreshUser
  };
}
