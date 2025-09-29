import { create } from 'zustand';
import type { Shift } from '@shared/schema';

interface SessionStore {
  userId: string;
  currentShift: Shift | null;
  setUserId: (userId: string) => void;
  setCurrentShift: (shift: Shift | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  userId: 'default-user-id', // Default user ID until auth is implemented
  currentShift: null,
  setUserId: (userId) => set({ userId }),
  setCurrentShift: (shift) => set({ currentShift: shift }),
}));
