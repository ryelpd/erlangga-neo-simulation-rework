import { Link } from 'react-router-dom';
import { ArrowLeft, Inbox } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SimulationGrid } from '@/components/simulation/SimulationGrid';
import { useFavorites } from '@/hooks/useFavorites';
import { simulations } from '@/data/simulations';

export function Favorites() {
  const { favorites } = useFavorites();
  
  const favoriteSimulations = simulations.filter(sim => 
    favorites.includes(sim.id)
  );

  return (
    <MainLayout>
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900">
          My Favorites
        </h1>
        <p className="text-slate-500 mt-2">
          {favoriteSimulations.length} saved simulations
        </p>
      </div>

      {favoriteSimulations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            No favorites yet
          </h2>
          <p className="text-slate-500 mb-6">
            Start exploring and save your favorite simulations
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
          >
            Browse Simulations
          </Link>
        </div>
      ) : (
        <SimulationGrid simulations={favoriteSimulations} />
      )}
    </MainLayout>
  );
}
