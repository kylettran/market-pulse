import { useEffect, Component } from 'react';
import { useApp } from './store';
import { isDemoMode } from './api';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StockView } from './components/StockView';
import { WatchlistView } from './components/Watchlist';
import { NewsFeed } from './components/News';
import { SearchModal } from './components/Search';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('View crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
          <div className="w-12 h-12 rounded-xl bg-loss-bg flex items-center justify-center mb-4">
            <span className="text-loss text-2xl">!</span>
          </div>
          <h2 className="text-text-primary font-semibold mb-2">Something went wrong</h2>
          <p className="text-text-muted text-sm mb-4">This view ran into an error. Try navigating to another section.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  let view;
  switch (state.activeView) {
    case 'dashboard': view = <Dashboard />; break;
    case 'stock': view = <StockView />; break;
    case 'watchlist': view = <WatchlistView />; break;
    case 'news': view = <NewsFeed />; break;
    default: view = <Dashboard />;
  }
  return <ErrorBoundary key={state.activeView}>{view}</ErrorBoundary>;
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
