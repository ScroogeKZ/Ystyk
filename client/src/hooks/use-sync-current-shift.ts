import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from './use-session-store';
import type { Shift } from '@shared/schema';

/**
 * Hook to sync current shift from backend to session store
 * Should be mounted once at the POS page level
 */
export const useSyncCurrentShift = () => {
  const { userId, setCurrentShift } = useSessionStore();

  const { data: currentShift } = useQuery<Shift | null>({
    queryKey: ['/api/shifts/current', userId],
    queryFn: async () => {
      const response = await fetch(`/api/shifts/current/${userId}`);
      if (!response.ok) {
        if (response.status === 404 || response.status === 204) {
          return null;
        }
        throw new Error('Failed to fetch current shift');
      }
      const data = await response.json();
      return data || null;
    },
  });

  useEffect(() => {
    setCurrentShift(currentShift || null);
  }, [currentShift, setCurrentShift]);

  return currentShift;
};
