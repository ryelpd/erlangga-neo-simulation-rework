import { useState, useEffect, useCallback } from 'react';
import type { Simulation } from '@/types';
import { searchSimulations } from '@/data/simulations';

export function useSearch(simulations: Simulation[], debounceMs: number = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Simulation[]>(simulations);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(simulations);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const filtered = searchSimulations(searchQuery);
    setResults(filtered);
    setIsSearching(false);
  }, [simulations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, search]);

  const clearSearch = () => {
    setQuery('');
    setResults(simulations);
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  };
}
