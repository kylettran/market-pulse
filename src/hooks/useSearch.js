import { useState, useEffect } from 'react';
import { searchSymbol } from '../api';

const ALLOWED_SYMBOLS = new Set(['GOOGL', 'AMZN', 'AAPL', 'NVDA', 'TSLA', 'META', 'MSFT']);

export function useSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchSymbol(query);
        const filtered = (data?.result || []).filter(r => ALLOWED_SYMBOLS.has(r.symbol));
        setResults(filtered);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
