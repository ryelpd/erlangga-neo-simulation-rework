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
          ? { label: 'All', color: 'bg-slate-200 text-slate-700' } 
          : CATEGORY_CONFIG[category];
        const isSelected = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-200'
            }`}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
