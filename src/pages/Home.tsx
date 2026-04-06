import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryFilter } from '@/components/common/CategoryFilter';
import { SimulationGrid } from '@/components/simulation/SimulationGrid';
import { useSearch } from '@/hooks/useSearch';
import { useFilter } from '@/hooks/useFilter';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { simulations } from '@/data/simulations';
import type { Simulation, Category } from '@/types';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  const { query, setQuery, clearSearch, results: searchResults } = useSearch(simulations);
  const { filteredSimulations } = useFilter(searchResults);
  const { recentlyViewed } = useRecentlyViewed();

  // Apply category filter on top of search results
  const displaySimulations = selectedCategory === 'All'
    ? filteredSimulations
    : filteredSimulations.filter(sim => sim.category === selectedCategory);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-4">
          Erlangga Neo Simulation
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Interactive simulations for Science education
        </p>

        {/* Search */}
        <div className="flex justify-center mb-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
            placeholder="Search 70+ simulations..."
          />
        </div>

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && !query && selectedCategory === 'All' && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-100">Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyViewed.map((sim) => (
              <Link
                key={sim.id}
                to={sim.path}
                className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500 transition-all group"
              >
                <h3 className="font-medium text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {sim.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{sim.category}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            {query || selectedCategory !== 'All' ? 'Search Results' : 'All Simulations'}
          </h2>
          <span className="text-slate-400">
            {displaySimulations.length} of {simulations.length} simulations
          </span>
        </div>

        <SimulationGrid simulations={displaySimulations as Simulation[]} />
      </section>
    </MainLayout>
  );
}
