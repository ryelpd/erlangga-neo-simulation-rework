import type { Category } from '@/types';
import { CATEGORY_CONFIG } from '@/types';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
}

const categories: (Category | 'All')[] = ['All', 'Astronomy', 'Biology', 'Chemistry', 'ComputerScience', 'Mathematics', 'Physics', 'EarthScience'];

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => {
        const config = category === 'All' 
          ? { label: 'All', color: 'bg-slate-600' } 
          : CATEGORY_CONFIG[category];
        const isSelected = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600'
            }`}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
