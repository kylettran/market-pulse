import { useState, useEffect } from 'react';
import { getCompanyNews, getMarketNews } from '../api';

export function useNews(symbol) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        const news = symbol ? await getCompanyNews(symbol) : await getMarketNews();
        if (!cancelled) setData(Array.isArray(news) ? news.slice(0, 12) : []);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [symbol]);

  return { data, loading };
}
