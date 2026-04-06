import type { Simulation } from '@/types';
import { SimulationCard } from './SimulationCard';

interface SimulationGridProps {
  simulations: Simulation[];
  title?: string;
}

export function SimulationGrid({ simulations, title }: SimulationGridProps) {
  if (simulations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg">No simulations found</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h2 className="text-2xl font-bold text-slate-100 mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {simulations.map((simulation) => (
          <SimulationCard key={simulation.id} simulation={simulation} />
        ))}
      </div>
    </div>
  );
}
