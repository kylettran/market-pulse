import { useState, useEffect } from 'react';
import { X, Plus, Star } from 'lucide-react';
import { useApp } from '../store';
import { getQuotes, getCandles } from '../api';
import { formatPrice, formatPercent, formatChange } from '../utils';
import { Sparkline } from './Sparkline';

export function WatchlistView() {
  const { state, dispatch } = useApp();
  const [quotes, setQuotes] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.watchlist.length === 0) { setLoading(false); return; }
    let cancelled = false;
    async function fetchAll() {
      const q = await getQuotes(state.watchlist);
      if (!cancelled) { setQuotes(q); setLoading(false); }

      const sparkData = {};
      for (const sym of state.watchlist) {
        try {
          const c = await getCandles(sym, 'D');
          if (c?.c) sparkData[sym] = c.c.slice(-30);
        } catch {}
      }
      if (!cancelled) setSparklines(sparkData);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [state.watchlist]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Watchlist</h1>
          <p className="text-text-muted text-sm mt-1">{state.watchlist.length} stocks tracked</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SEARCH' })}
          className="px-3 py-2 rounded-lg border border-border bg-bg-card text-text-muted hover:text-accent hover:border-accent/30 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          Add Stock
        </button>
      </div>

      {state.watchlist.length === 0 ? (
        <div className="text-center py-16">
          <Star size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted text-sm">No stocks in your watchlist</p>
          <p className="text-text-muted text-xs mt-1">Search and add stocks to track them here</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {state.watchlist.map(sym => {
            const q = quotes[sym];
            const isUp = (q?.dp || 0) >= 0;
            return (
              <div
                key={sym}
                className="bg-bg-card/60 border border-border rounded-xl px-4 py-3 flex items-center gap-4
                  hover:border-border-light transition-all group"
              >
                <button
                  onClick={() => dispatch({ type: 'SELECT_STOCK', payload: sym })}
                  className="flex-1 flex items-center gap-4 cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-deep/10 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">{sym.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-text-primary font-semibold text-sm">{sym}</span>
                    <div className="text-text-muted text-xs">{q ? formatPrice(q.c) : '—'}</div>
                  </div>
                  <Sparkline
                    data={sparklines[sym] || []}
                    color={isUp ? '#6ee7b7' : '#fca5a5'}
                    width={80}
                    height={28}
                  />
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${isUp ? 'text-gain' : 'text-loss'}`}>
                      {q ? formatChange(q.d) : '—'}
                    </span>
                    <div className={`text-xs ${isUp ? 'text-gain' : 'text-loss'}`}>
                      {q ? formatPercent(q.dp) : '—'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: sym })}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-loss hover:bg-loss-bg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
