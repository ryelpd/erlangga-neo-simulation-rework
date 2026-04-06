import { useCallback } from 'react';
import { useFavoritesStore } from '@/stores/favoritesStore';

export function useFavorites() {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const toggleFavorite = useCallback((id: string) => {
    if (isFavorite(id)) {
      removeFavorite(id);
    } else {
      addFavorite(id);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
