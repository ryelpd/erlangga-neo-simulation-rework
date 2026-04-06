import { Link } from 'react-router-dom';
import type { Simulation } from '@/types';
import { CATEGORY_CONFIG } from '@/types';
import { FavoriteButton } from './FavoriteButton';

interface SimulationCardProps {
  simulation: Simulation;
}

export function SimulationCard({ simulation }: SimulationCardProps) {
  const categoryConfig = CATEGORY_CONFIG[simulation.category];

  return (
    <Link
      to={simulation.path}
      className="group relative bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
          <FavoriteButton simulationId={simulation.id} size="sm" />
        </div>

        <h3 className="text-lg font-semibold text-slate-100 mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {simulation.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-3 py-2 rounded-lg inline-block">
          <span>📁</span>
          <span className="truncate">{simulation.path}</span>
        </div>
      </div>
    </Link>
  );
}
