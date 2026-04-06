import { Link } from 'react-router-dom';
import { Atom, Home, Star } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <Atom className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Erlangga Neo</h1>
              <p className="text-xs text-slate-500">Simulation Platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/favorites"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
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
