import { useState, useEffect } from 'react';
import { getCandles } from '../api';

const TIMEFRAME_CONFIG = {
  '1D': { resolution: '5', days: 1 },
  '1W': { resolution: '15', days: 7 },
  '1M': { resolution: '60', days: 30 },
  '3M': { resolution: 'D', days: 90 },
  '6M': { resolution: 'D', days: 180 },
  '1Y': { resolution: 'D', days: 365 },
};

export function useCandles(symbol, timeframe = '1Y') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        const cfg = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG['1Y'];
        const to = Math.floor(Date.now() / 1000);
        const from = to - cfg.days * 86400;
        const candles = await getCandles(symbol, cfg.resolution, from, to);
        if (!cancelled && candles && candles.s === 'ok') setData(candles);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [symbol, timeframe]);

  return { data, loading };
}
