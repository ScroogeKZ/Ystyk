import { create } from 'zustand';
import type { Shift } from '@shared/schema';

interface SessionStore {
  userId: string;
  currentShift: Shift | null;
  setUserId: (userId: string) => void;
  setCurrentShift: (shift: Shift | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  userId: '28fb1a59-5202-4cb1-a2b0-c1aee6e4686b', // Default cashier user
  currentShift: null,
  setUserId: (userId) => set({ userId }),
  setCurrentShift: (shift) => set({ currentShift: shift }),
}));
