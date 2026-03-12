import { LayoutDashboard, LineChart, Star, Newspaper, Search } from 'lucide-react';
import { useApp } from '../store';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
  { id: 'stock', icon: LineChart, label: 'Stock' },
  { id: 'watchlist', icon: Star, label: 'Watchlist' },
  { id: 'news', icon: Newspaper, label: 'News' },
];

export function Sidebar() {
  const { state, dispatch } = useApp();

  return (
    <aside className="w-[68px] h-full bg-bg-surface border-r border-border flex flex-col items-center py-4 shrink-0">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-accent-deep/20 flex items-center justify-center mb-6">
        <span className="text-accent font-bold text-sm">MP</span>
      </div>

      {/* Search button */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SEARCH' })}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/5 transition-all mb-4 cursor-pointer"
        title="Search (⌘K)"
      >
        <Search size={18} />
      </button>

      <div className="w-8 h-px bg-border mb-4" />

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = state.activeView === id;
          return (
            <button
              key={id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: id })}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative cursor-pointer group
                ${active
                  ? 'text-accent bg-accent/10'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-card/50'
                }`}
              title={label}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
              )}
              <Icon size={18} />
            </button>
          );
        })}
      </nav>

      {/* Bottom indicator */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <div className="w-2 h-2 rounded-full bg-gain animate-pulse" title="Data Active" />
      </div>
    </aside>
  );
}
