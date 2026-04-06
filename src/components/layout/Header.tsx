import { Link } from 'react-router-dom';
import { Atom, Home, Star } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Atom className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Erlangga Neo</h1>
              <p className="text-xs text-slate-500">Simulation Platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/favorites"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Favorites</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
