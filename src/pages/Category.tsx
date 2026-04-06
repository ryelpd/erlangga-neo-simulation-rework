import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SimulationGrid } from '@/components/simulation/SimulationGrid';
import { getSimulationsByCategory } from '@/data/simulations';
import type { Category } from '@/types';
import { CATEGORY_CONFIG } from '@/types';

export function Category() {
  const { category } = useParams<{ category: string }>();
  
  const categoryKey = category as Category;
  const categorySimulations = getSimulationsByCategory(categoryKey);
  const categoryConfig = CATEGORY_CONFIG[categoryKey];

  if (!categoryConfig) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Category not found</h1>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full text-sm font-medium text-white ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
          <span className="text-slate-400">
            {categorySimulations.length} simulations
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-100 mt-4">
          {categoryConfig.label} Simulations
        </h1>
      </div>

      <SimulationGrid simulations={categorySimulations} />
    </MainLayout>
  );
}
