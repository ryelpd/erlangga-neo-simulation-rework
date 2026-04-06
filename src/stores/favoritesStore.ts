import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (id) => {
        if (!get().favorites.includes(id)) {
          set({ favorites: [...get().favorites, id] });
        }
      },
      removeFavorite: (id) => {
        set({ favorites: get().favorites.filter(fav => fav !== id) });
      },
      isFavorite: (id) => get().favorites.includes(id),
    }),
    {
      name: 'favorites-storage',
    }
  )
);
