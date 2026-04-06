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
          ? 'text-yellow-400 bg-yellow-400/10'
          : 'text-slate-500 hover:text-yellow-400 hover:bg-slate-700'
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
