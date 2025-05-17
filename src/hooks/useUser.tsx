
import { useContext } from 'react';
import { UserContext } from '@/context/UserContext';

export function useUser() {
  const { userRole, clientStatus, isLoading, userId } = useContext(UserContext);
  
  return {
    user: { id: userId },
    userId,
    userRole,
    clientStatus,
    isLoading,
    error: null,
    refreshUser: async () => {}
  };
}
