import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApp } from '../store';
import { getQuotes, getCandles } from '../api';
import { formatPrice, formatPercent, formatChange } from '../utils';
import { Sparkline } from './Sparkline';

const INDICES = [
  { symbol: 'SPX', name: 'S&P 500' },
  { symbol: 'NDX', name: 'NASDAQ 100' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'IWM', name: 'Russell 2000' },
];

const SECTORS = [
  { symbol: 'XLP',  name: 'Consumer Staples' },
  { symbol: 'XLY',  name: 'Consumer Disc.' },
  { symbol: 'XLV',  name: 'Healthcare' },
  { symbol: 'XLI',  name: 'Industrials' },
  { symbol: 'XLE',  name: 'Energy' },
  { symbol: 'XLF',  name: 'Financials' },
  { symbol: 'XLK',  name: 'Technology' },
  { symbol: 'XLU',  name: 'Utilities' },
  { symbol: 'XLB',  name: 'Materials' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLC',  name: 'Communication' },
];

const MAG7 = ['GOOGL', 'AMZN', 'AAPL', 'NVDA', 'TSLA', 'META', 'MSFT'];

export function Dashboard() {
  const { dispatch } = useApp();
  const [quotes, setQuotes] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const allSymbols = [
        ...INDICES.map(i => i.symbol),
        ...SECTORS.map(s => s.symbol),
        ...MAG7,
      ];
      const unique = [...new Set(allSymbols)];
      const q = await getQuotes(unique);
      if (!cancelled) { setQuotes(q); setLoading(false); }

      // Fetch sparkline data for indices
      const sparkData = {};
      for (const idx of INDICES) {
        try {
          const c = await getCandles(idx.symbol, 'D');
          if (c?.c) sparkData[idx.symbol] = c.c.slice(-30);
        } catch {}
      }
      if (!cancelled) setSparklines(sparkData);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const { gainers, losers } = useMemo(() => {
    const withData = MAG7
      .map(s => ({ symbol: s, ...quotes[s] }))
      .filter(m => m.c);
    const sorted = [...withData].sort((a, b) => (b.dp || 0) - (a.dp || 0));
    return {
      gainers: sorted.filter(m => (m.dp || 0) >= 0).slice(0, 4),
      losers:  sorted.filter(m => (m.dp || 0) < 0).slice(0, 4),
    };
  }, [quotes]);

  const marketPulse = useMemo(() => {
    let up = 0, total = 0;
    INDICES.forEach(({ symbol }) => {
      const q = quotes[symbol];
      if (q) { if (q.dp > 0) up++; total++; }
    });
    SECTORS.forEach(({ symbol }) => {
      const q = quotes[symbol];
      if (q) { if (q.dp > 0) up++; total++; }
    });
    const score = total > 0 ? Math.round((up / total) * 100) : 50;
    return { score, label: score >= 60 ? 'Bullish' : score <= 40 ? 'Bearish' : 'Neutral' };
  }, [quotes]);

  function selectStock(symbol) {
    dispatch({ type: 'SELECT_STOCK', payload: symbol });
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Market Overview</h1>
          <p className="text-text-muted text-sm mt-1">Real-time market data and insights</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
          Live
        </div>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {INDICES.map(({ symbol, name }) => {
          const q = quotes[symbol];
          if (!q && loading) return <div key={symbol} className="animate-shimmer h-[120px] rounded-xl" />;
          const isUp = (q?.dp || 0) >= 0;
          return (
            <button
              key={symbol}
              onClick={() => selectStock(symbol)}
              className="bg-bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 text-left
                hover:border-border-light hover:shadow-[0_0_20px_rgba(196,181,253,0.06)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-text-muted text-xs">{symbol}</span>
                  <h3 className="text-text-primary font-medium text-sm">{name}</h3>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUp ? 'bg-gain-bg' : 'bg-loss-bg'}`}>
                  {isUp ? <TrendingUp size={14} className="text-gain" /> : <TrendingDown size={14} className="text-loss" />}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xl font-semibold text-text-primary">{q ? formatPrice(q.c) : '—'}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-medium ${isUp ? 'text-gain' : 'text-loss'}`}>
                      {q ? formatChange(q.d) : '—'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isUp ? 'bg-gain-bg text-gain' : 'bg-loss-bg text-loss'}`}>
                      {q ? formatPercent(q.dp) : '—'}
                    </span>
                  </div>
                </div>
                <Sparkline
                  data={sparklines[symbol] || []}
                  color={isUp ? '#6ee7b7' : '#fca5a5'}
                  width={80}
                  height={28}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Market Pulse */}
      <div className="bg-bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-text-primary">Market Pulse</h2>
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full
            ${marketPulse.score >= 60 ? 'bg-gain-bg text-gain' : marketPulse.score <= 40 ? 'bg-loss-bg text-loss' : 'bg-accent/10 text-accent'}`}>
            {marketPulse.label}
          </span>
        </div>
        <div className="relative h-3 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${marketPulse.score}%`,
              background: `linear-gradient(90deg, #fca5a5 0%, #c4b5fd 50%, #6ee7b7 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>Bearish</span>
          <span className="font-medium text-text-secondary">{marketPulse.score}%</span>
          <span>Bullish</span>
        </div>
      </div>

      {/* Sector Performance + Magnificent 7 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sectors */}
        <div className="xl:col-span-2 bg-bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Sector Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {SECTORS.map(({ symbol, name }) => {
              const q = quotes[symbol];
              const isUp = (q?.dp || 0) >= 0;
              return (
                <button
                  key={symbol}
                  onClick={() => selectStock(symbol)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-bg-surface/50 hover:bg-bg-surface transition-colors cursor-pointer text-left"
                >
                  <span className="text-text-secondary text-xs truncate mr-2">{name}</span>
                  <span className={`text-xs font-semibold whitespace-nowrap ${isUp ? 'text-gain' : 'text-loss'}`}>
                    {q ? formatPercent(q.dp) : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Magnificent 7 */}
        <div className="bg-bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Magnificent 7</h2>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight size={12} className="text-gain" />
              <span className="text-xs text-text-muted font-medium">Leaders</span>
            </div>
            <div className="space-y-1">
              {gainers.map(m => (
                <button
                  key={m.symbol}
                  onClick={() => selectStock(m.symbol)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-surface/50 transition-colors cursor-pointer"
                >
                  <span className="text-text-primary text-xs font-medium">{m.symbol}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs">{formatPrice(m.c)}</span>
                    <span className="text-gain text-xs font-semibold bg-gain-bg px-1.5 py-0.5 rounded">
                      {formatPercent(m.dp)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDownRight size={12} className="text-loss" />
              <span className="text-xs text-text-muted font-medium">Laggards</span>
            </div>
            <div className="space-y-1">
              {losers.map(m => (
                <button
                  key={m.symbol}
                  onClick={() => selectStock(m.symbol)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-surface/50 transition-colors cursor-pointer"
                >
                  <span className="text-text-primary text-xs font-medium">{m.symbol}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs">{formatPrice(m.c)}</span>
                    <span className="text-loss text-xs font-semibold bg-loss-bg px-1.5 py-0.5 rounded">
                      {formatPercent(m.dp)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Magnificent 7 — full row for quick access */}
      <div className="bg-bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Magnificent 7 — Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MAG7.map(symbol => {
            const q = quotes[symbol];
            const isUp = (q?.dp || 0) >= 0;
            return (
              <button
                key={symbol}
                onClick={() => selectStock(symbol)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-surface/50 hover:bg-bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
              >
                <span className="text-text-primary text-xs font-bold">{symbol}</span>
                <span className="text-text-secondary text-xs">{q ? formatPrice(q.c) : '—'}</span>
                <span className={`text-xs font-semibold ${isUp ? 'text-gain' : 'text-loss'}`}>
                  {q ? formatPercent(q.dp) : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
