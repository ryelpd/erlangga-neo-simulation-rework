import { Suspense, lazy, type ComponentType } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { getSimulationById } from '@/data/simulations';
import { CATEGORY_CONFIG } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { useHistoryStore } from '@/stores/historyStore';

// Lazy load all simulation components
const simulations = import.meta.glob('../../simulations/**/index.tsx');

const simulationComponents: Record<string, () => Promise<{ default: ComponentType }>> = {};
Object.entries(simulations).forEach(([path, importFunc]) => {
  const match = path.match(/\/simulations\/([^/]+)\/([^/]+)\/index\.tsx$/);
  if (match) {
    const simName = match[2];
    const id = `${simName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`;
    simulationComponents[id] = async () => {
      const module = await importFunc() as { default: ComponentType };
      return { default: module.default };
    };
  }
});

export function SimulationPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const addToHistory = useHistoryStore((state) => state.addToHistory);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Invalid simulation ID</h1>
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const simulation = getSimulationById(id);
  const categoryConfig = simulation ? CATEGORY_CONFIG[simulation.category] : null;

  // Add to history on mount
  addToHistory(id);

  if (!simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Simulation not found</h1>
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const SimulationComponent = simulationComponents[id] 
    ? lazy(simulationComponents[id])
    : null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${categoryConfig?.color}`}>
                    {categoryConfig?.label}
                  </span>
                  <h1 className="text-xl font-semibold text-slate-100">{simulation.title}</h1>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(simulation.id)}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isFavorite(simulation.id)
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-slate-500 hover:text-yellow-400 hover:bg-slate-800'
              }`}
            >
              <Star
                className="w-6 h-6"
                fill={isFavorite(simulation.id) ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Simulation Content */}
      <main className="max-w-7xl mx-auto p-4">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <LoadingSpinner size="lg" />
            </div>
          }>
            {SimulationComponent ? (
              <SimulationComponent />
            ) : (
              <div className="text-center py-16 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400">Simulation component not found</p>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
