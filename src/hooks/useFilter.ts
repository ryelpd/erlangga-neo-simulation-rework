import { useState, useMemo } from 'react';
import type { Simulation, Category } from '@/types';

export function useFilter(simulations: Simulation[]) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredSimulations = useMemo(() => {
    if (selectedCategory === 'All') {
      return simulations;
    }
    return simulations.filter(sim => sim.category === selectedCategory);
  }, [simulations, selectedCategory]);

  const clearFilter = () => {
    setSelectedCategory('All');
  };

  return {
    selectedCategory,
    setSelectedCategory,
    filteredSimulations,
    clearFilter,
  };
}
