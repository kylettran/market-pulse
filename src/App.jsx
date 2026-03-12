import { useEffect } from 'react';
import { useApp } from './store';
import { isDemoMode } from './api';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StockView } from './components/StockView';
import { WatchlistView } from './components/Watchlist';
import { NewsFeed } from './components/News';
import { SearchModal } from './components/Search';

function DemoBanner() {
  return (
    <div className="bg-accent-deep/10 border-b border-accent-deep/20 text-center py-2 px-4 shrink-0">
      <span className="text-xs text-accent">
        Demo Mode — Using simulated market data.
      </span>
      <a
        href="https://finnhub.io/register"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 text-xs text-accent underline hover:text-accent-deep transition-colors"
      >
        Get a free API key
      </a>
    </div>
  );
}

function ViewContent() {
  const { state } = useApp();
  switch (state.activeView) {
    case 'dashboard': return <Dashboard />;
    case 'stock': return <StockView />;
    case 'watchlist': return <WatchlistView />;
    case 'news': return <NewsFeed />;
    default: return <Dashboard />;
  }
}

export default function App() {
  const { state, dispatch } = useApp();

  // Global keyboard shortcut: Cmd+K to open search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_SEARCH' });
      }
      if (e.key === 'Escape' && state.searchOpen) {
        dispatch({ type: 'CLOSE_SEARCH' });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.searchOpen, dispatch]);

  return (
    <div className="h-full flex flex-col">
      {isDemoMode && <DemoBanner />}
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <ViewContent />
        </main>
      </div>
      {state.searchOpen && <SearchModal />}
    </div>
  );
}
