export type Category = 
  | 'Astronomy' 
  | 'Biology' 
  | 'Chemistry' 
  | 'ComputerScience' 
  | 'Mathematics' 
  | 'Physics' 
  | 'EarthScience'
  | 'AlgebraLinear'
  | 'Statistics';

export interface Simulation {
  id: string;
  title: string;
  category: Category;
  path: string;
  description?: string;
  tags: string[];
}

export interface HistoryItem {
  id: string;
  viewedAt: number;
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; count: number }> = {
  Astronomy: { label: 'Astronomy', color: 'bg-violet-500', count: 5 },
  Biology: { label: 'Biology', color: 'bg-emerald-500', count: 8 },
  Chemistry: { label: 'Chemistry', color: 'bg-amber-500', count: 5 },
  ComputerScience: { label: 'Computer Science', color: 'bg-sky-500', count: 4 },
  Mathematics: { label: 'Mathematics', color: 'bg-orange-500', count: 9 },
  Physics: { label: 'Physics', color: 'bg-rose-500', count: 36 },
  EarthScience: { label: 'Earth Science', color: 'bg-teal-500', count: 1 },
  AlgebraLinear: { label: 'Algebra Linear', color: 'bg-cyan-500', count: 1 },
  Statistics: { label: 'Statistics', color: 'bg-violet-500', count: 1 },
};
