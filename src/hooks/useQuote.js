import { useState, useEffect } from 'react';
import { getQuote } from '../api';

export function useQuote(symbol) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    async function fetch() {
      try {
        if (!data) setLoading(true);
        const q = await getQuote(symbol);
        if (!cancelled) { setData(q); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  return { data, loading, error };
}
