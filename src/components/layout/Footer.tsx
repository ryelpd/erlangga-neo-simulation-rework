export function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Erlangga Neo Simulation Platform</p>
          <p className="mt-2">Interactive simulations for Science education</p>
        </div>
      </div>
    </footer>
  );
}
