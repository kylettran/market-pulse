import { useState, useMemo } from 'react';
import { ArrowLeft, Star, StarOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../store';
import { useQuote } from '../hooks/useQuote';
import { useCandles } from '../hooks/useCandles';
import { useProfile } from '../hooks/useProfile';
import { useNews } from '../hooks/useNews';
import { CandleChart, IndicatorChart } from './Chart';
import { NewsCard } from './News';
import {
  formatPrice, formatPercent, formatChange, formatLargeNumber,
  calcSMA, calcRSI, calcMACD, calcBollingerBands, generateSignals,
} from '../utils';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y'];

export function StockView() {
  const { state, dispatch } = useApp();
  const symbol = state.selectedStock || 'AAPL';
  const [timeframe, setTimeframe] = useState('1Y');
  const [showIndicators, setShowIndicators] = useState({ sma: true, bb: false, rsi: true, macd: false });

  const { data: quote } = useQuote(symbol);
  const { data: candles, loading: candlesLoading } = useCandles(symbol, timeframe);
  const { profile, metrics, recommendations } = useProfile(symbol);
  const { data: news } = useNews(symbol);

  const isUp = (quote?.dp || 0) >= 0;
  const inWatchlist = state.watchlist.includes(symbol);

  const overlays = useMemo(() => {
    if (!candles?.c) return {};
    const closes = candles.c;
    const result = {};
    if (showIndicators.sma) {
      result.sma20 = calcSMA(closes, 20);
      result.sma50 = calcSMA(closes, 50);
    }
    if (showIndicators.bb) {
      const bb = calcBollingerBands(closes);
      result.bbUpper = bb.upper;
      result.bbLower = bb.lower;
    }
    return result;
  }, [candles, showIndicators.sma, showIndicators.bb]);

  const rsiData = useMemo(() => {
    if (!candles?.c || !showIndicators.rsi) return null;
    return calcRSI(candles.c);
  }, [candles, showIndicators.rsi]);

  const macdData = useMemo(() => {
    if (!candles?.c || !showIndicators.macd) return null;
    return calcMACD(candles.c);
  }, [candles, showIndicators.macd]);

  const signals = useMemo(() => {
    if (!candles?.c) return null;
    return generateSignals(candles.c);
  }, [candles]);

  function toggleWatchlist() {
    dispatch({
      type: inWatchlist ? 'REMOVE_FROM_WATCHLIST' : 'ADD_TO_WATCHLIST',
      payload: symbol,
    });
  }

  const recTotal = recommendations
    ? (recommendations.strongBuy || 0) + (recommendations.buy || 0) + (recommendations.hold || 0) + (recommendations.sell || 0) + (recommendations.strongSell || 0)
    : 0;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
          className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">{symbol}</h1>
            <span className="text-text-muted text-sm">{profile?.name || ''}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-bold text-text-primary">{quote ? formatPrice(quote.c) : '—'}</span>
            <span className={`text-sm font-medium ${isUp ? 'text-gain' : 'text-loss'}`}>
              {quote ? `${formatChange(quote.d)} (${formatPercent(quote.dp)})` : ''}
            </span>
          </div>
        </div>
        <button
          onClick={toggleWatchlist}
          className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer
            ${inWatchlist
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-border bg-bg-card text-text-muted hover:text-accent hover:border-accent/30'
            }`}
        >
          {inWatchlist ? <StarOff size={14} /> : <Star size={14} />}
          {inWatchlist ? 'Remove' : 'Watch'}
        </button>
      </div>

      {/* Timeframe + Indicator toggles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-bg-card/60 rounded-lg p-1 border border-border">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer
                ${tf === timeframe ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[
            { key: 'sma', label: 'SMA' },
            { key: 'bb', label: 'BB' },
            { key: 'rsi', label: 'RSI' },
            { key: 'macd', label: 'MACD' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setShowIndicators(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer
                ${showIndicators[key] ? 'bg-accent-deep/20 text-accent' : 'bg-bg-card text-text-muted border border-border hover:text-text-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-bg-card/40 border border-border rounded-xl p-2 overflow-hidden">
        {candlesLoading || !candles ? (
          <div className="animate-shimmer h-[400px] rounded-lg" />
        ) : (
          <CandleChart candles={candles} height={400} overlays={overlays} />
        )}
      </div>

      {/* Sub-charts: RSI and MACD */}
      {showIndicators.rsi && rsiData && candles && (
        <div className="bg-bg-card/40 border border-border rounded-xl p-2 overflow-hidden">
          <span className="text-xs text-text-muted ml-2">RSI (14)</span>
          <IndicatorChart data={rsiData} timestamps={candles.t} color="#c4b5fd" height={100} />
        </div>
      )}
      {showIndicators.macd && macdData && candles && (
        <div className="bg-bg-card/40 border border-border rounded-xl p-2 overflow-hidden">
          <span className="text-xs text-text-muted ml-2">MACD</span>
          <IndicatorChart data={macdData.histogram} timestamps={candles.t} color="#c4b5fd" type="histogram" height={100} />
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Signals */}
        {signals && (
          <div className="bg-bg-card/60 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Signal Summary</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                ${signals.signal === 'Bullish' ? 'bg-gain-bg text-gain' : signals.signal === 'Bearish' ? 'bg-loss-bg text-loss' : 'bg-accent/10 text-accent'}`}>
                {signals.signal} ({signals.score}%)
              </span>
            </div>
            <div className="space-y-2">
              {signals.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{d.name}</span>
                  <div className="flex items-center gap-2">
                    {d.value && <span className="text-text-muted">{d.value}</span>}
                    <span className={
                      d.signal === 'Bullish' ? 'text-gain' : d.signal === 'Bearish' ? 'text-loss' : 'text-text-muted'
                    }>
                      {d.signal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {metrics && (
          <div className="bg-bg-card/60 border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
              {[
                ['Market Cap', formatLargeNumber((metrics.marketCapitalization || 0) * 1e6)],
                ['P/E Ratio', metrics.peBasicExclExtraTTM?.toFixed(1) || '—'],
                ['EPS', `$${metrics.epsBasicExclExtraItemsTTM?.toFixed(2) || '—'}`],
                ['Beta', metrics.beta?.toFixed(2) || '—'],
                ['52W High', `$${metrics['52WeekHigh'] || '—'}`],
                ['52W Low', `$${metrics['52WeekLow'] || '—'}`],
                ['Div Yield', `${metrics.dividendYieldIndicatedAnnual || '0'}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-muted">{label}</span>
                  <span className="text-text-secondary font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyst Recommendations */}
        {recommendations && recTotal > 0 && (
          <div className="bg-bg-card/60 border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Analyst Consensus</h3>
            <div className="space-y-2">
              {[
                { label: 'Strong Buy', value: recommendations.strongBuy, color: '#6ee7b7' },
                { label: 'Buy', value: recommendations.buy, color: '#86efac' },
                { label: 'Hold', value: recommendations.hold, color: '#c4b5fd' },
                { label: 'Sell', value: recommendations.sell, color: '#fca5a5' },
                { label: 'Strong Sell', value: recommendations.strongSell, color: '#f87171' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted w-20">{label}</span>
                  <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(value / recTotal) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-text-secondary w-6 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Company News */}
      {news.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Latest News</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {news.slice(0, 4).map((n, i) => (
              <NewsCard key={n.id || i} article={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
