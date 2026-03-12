import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useApp } from '../store';
import { useSearch } from '../hooks/useSearch';

export function SearchModal() {
  const { dispatch } = useApp();
  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query);
  const inputRef = useRef();
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => { setSelectedIdx(0); }, [results]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      dispatch({ type: 'CLOSE_SEARCH' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      dispatch({ type: 'SELECT_STOCK', payload: results[selectedIdx].symbol });
      dispatch({ type: 'CLOSE_SEARCH' });
    }
  }

  function selectResult(symbol) {
    dispatch({ type: 'SELECT_STOCK', payload: symbol });
    dispatch({ type: 'CLOSE_SEARCH' });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => dispatch({ type: 'CLOSE_SEARCH' })}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <SearchIcon size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search stocks, ETFs..."
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted"
          />
          <button
            onClick={() => dispatch({ type: 'CLOSE_SEARCH' })}
            className="text-text-muted hover:text-text-secondary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((r, i) => (
              <button
                key={r.symbol}
                onClick={() => selectResult(r.symbol)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer
                  ${i === selectedIdx ? 'bg-accent/8' : 'hover:bg-bg-card/50'}`}
              >
                <span className="text-accent font-semibold text-sm w-16">{r.symbol}</span>
                <span className="text-text-secondary text-sm truncate flex-1">{r.description}</span>
                <span className="text-text-muted text-xs">{r.type}</span>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="py-8 text-center text-text-muted text-sm">No results found</div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-text-muted">
          <span><kbd className="px-1.5 py-0.5 bg-bg-card rounded text-[10px]">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-bg-card rounded text-[10px]">↵</kbd> Select</span>
          <span><kbd className="px-1.5 py-0.5 bg-bg-card rounded text-[10px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
