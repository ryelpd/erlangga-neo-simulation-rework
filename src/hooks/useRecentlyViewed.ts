import { useHistoryStore } from '@/stores/historyStore';

export function useRecentlyViewed() {
  const { history, addToHistory, clearHistory, getRecentlyViewed } = useHistoryStore();

  const recentlyViewed = getRecentlyViewed(4);

  return {
    history,
    recentlyViewed,
    addToHistory,
    clearHistory,
  };
}
