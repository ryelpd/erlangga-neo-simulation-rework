import { Star } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  simulationId: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ simulationId, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(simulationId);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(simulationId);
      }}
      className={`p-2 rounded-full transition-all hover:scale-110 ${
        favorite
          ? 'text-yellow-500 bg-yellow-50'
          : 'text-slate-300 hover:text-yellow-500 hover:bg-yellow-50'
      }`}
    >
      <Star
        className={sizeClasses[size]}
        fill={favorite ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  );
}
