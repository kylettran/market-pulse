// ── Formatters ──

export function formatPrice(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(num) {
  if (num == null) return '—';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatPercent(value) {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(value) {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ── Technical Indicators ──

export function calcSMA(closes, period) {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    result.push(sum / period);
  }
  return result;
}

export function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const result = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    result.push(closes[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return closes.map(() => null);
  const gains = [], losses = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const rsi = new Array(period).fill(null);
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calcEMA(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

export function calcBollingerBands(closes, period = 20, mult = 2) {
  const sma = calcSMA(closes, period);
  const upper = [], lower = [];
  for (let i = 0; i < closes.length; i++) {
    if (sma[i] === null) { upper.push(null); lower.push(null); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const stddev = Math.sqrt(variance);
    upper.push(mean + mult * stddev);
    lower.push(mean - mult * stddev);
  }
  return { upper, middle: sma, lower };
}

// ── Signal Generation ──

export function generateSignals(closes) {
  if (!closes || closes.length < 201) {
    return { bullish: 0, bearish: 0, score: 50, signal: 'Neutral', details: [] };
  }
  const rsi = calcRSI(closes);
  const { macdLine, signalLine } = calcMACD(closes);
  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);
  const last = closes.length - 1;
  const price = closes[last];

  let bullish = 0, bearish = 0;
  const details = [];

  const latestRSI = rsi[last];
  if (latestRSI != null) {
    if (latestRSI < 30) { bullish++; details.push({ name: 'RSI', value: latestRSI.toFixed(1), signal: 'Bullish', note: 'Oversold' }); }
    else if (latestRSI > 70) { bearish++; details.push({ name: 'RSI', value: latestRSI.toFixed(1), signal: 'Bearish', note: 'Overbought' }); }
    else { details.push({ name: 'RSI', value: latestRSI.toFixed(1), signal: 'Neutral', note: '' }); }
  }

  if (macdLine[last] > signalLine[last]) { bullish++; details.push({ name: 'MACD', signal: 'Bullish', note: 'Above signal' }); }
  else { bearish++; details.push({ name: 'MACD', signal: 'Bearish', note: 'Below signal' }); }

  if (sma20[last] && price > sma20[last]) { bullish++; details.push({ name: 'SMA 20', signal: 'Bullish', note: 'Price above' }); }
  else if (sma20[last]) { bearish++; details.push({ name: 'SMA 20', signal: 'Bearish', note: 'Price below' }); }

  if (sma50[last] && price > sma50[last]) { bullish++; details.push({ name: 'SMA 50', signal: 'Bullish', note: 'Price above' }); }
  else if (sma50[last]) { bearish++; details.push({ name: 'SMA 50', signal: 'Bearish', note: 'Price below' }); }

  if (sma200[last] && price > sma200[last]) { bullish++; details.push({ name: 'SMA 200', signal: 'Bullish', note: 'Price above' }); }
  else if (sma200[last]) { bearish++; details.push({ name: 'SMA 200', signal: 'Bearish', note: 'Price below' }); }

  const total = bullish + bearish || 1;
  return {
    bullish,
    bearish,
    score: Math.round((bullish / total) * 100),
    signal: bullish > bearish ? 'Bullish' : bullish < bearish ? 'Bearish' : 'Neutral',
    details,
  };
}
