export type Category = 
  | 'Astronomy' 
  | 'Biology' 
  | 'Chemistry' 
  | 'ComputerScience' 
  | 'Mathematics' 
  | 'Physics' 
  | 'EarthScience';

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
  Biology: { label: 'Biology', color: 'bg-green-500', count: 8 },
  Chemistry: { label: 'Chemistry', color: 'bg-yellow-500', count: 5 },
  ComputerScience: { label: 'Computer Science', color: 'bg-cyan-500', count: 4 },
  Mathematics: { label: 'Mathematics', color: 'bg-orange-500', count: 11 },
  Physics: { label: 'Physics', color: 'bg-red-500', count: 36 },
  EarthScience: { label: 'Earth Science', color: 'bg-teal-500', count: 1 },
};
