import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryItem } from '@/types';
import { getSimulationById } from '@/data/simulations';

interface HistoryStore {
  history: HistoryItem[];
  addToHistory: (id: string) => void;
  clearHistory: () => void;
  getRecentlyViewed: (limit: number) => Array<{ id: string; title: string; category: string; path: string }>;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      addToHistory: (id) => {
        const now = Date.now();
        const newHistory = get().history.filter(item => item.id !== id);
        newHistory.unshift({ id, viewedAt: now });
        set({ history: newHistory.slice(0, 10) });
      },
      clearHistory: () => {
        set({ history: [] });
      },
      getRecentlyViewed: (limit) => {
        return get().history.slice(0, limit).map(item => {
          const sim = getSimulationById(item.id);
          return {
            id: item.id,
            title: sim?.title || 'Unknown',
            category: sim?.category || 'Unknown',
            path: sim?.path || '#',
          };
        });
      },
    }),
    {
      name: 'history-storage',
    }
  )
);
