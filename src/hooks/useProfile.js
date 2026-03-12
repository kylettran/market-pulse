import { useState, useEffect } from 'react';
import { getCompanyProfile, getMetrics, getRecommendations } from '../api';

export function useProfile(symbol) {
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        const [p, m, r] = await Promise.all([
          getCompanyProfile(symbol),
          getMetrics(symbol),
          getRecommendations(symbol),
        ]);
        if (!cancelled) {
          setProfile(p);
          setMetrics(m?.metric || {});
          setRecommendations(Array.isArray(r) ? r[0] : null);
        }
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [symbol]);

  return { profile, metrics, recommendations, loading };
}
