// Procedural candle generator — realistic random-walk OHLCV data
function generateCandles(basePrice, volatility, days = 252) {
  const candles = { o: [], h: [], l: [], c: [], v: [], t: [], s: 'ok' };
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 86400;
  for (let i = days; i > 0; i--) {
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    const close = +(price + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * volatility * price * 0.5).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * volatility * price * 0.5).toFixed(2);
    const volume = Math.floor(15_000_000 + Math.random() * 50_000_000);
    candles.o.push(+open.toFixed(2));
    candles.h.push(high);
    candles.l.push(low);
    candles.c.push(close);
    candles.v.push(volume);
    candles.t.push(now - i * daySeconds);
    price = close;
  }
  return candles;
}

const STOCK_SEEDS = {
  SPY: { base: 528, vol: 0.012, name: 'SPDR S&P 500 ETF', industry: 'Index Fund' },
  QQQ: { base: 460, vol: 0.015, name: 'Invesco QQQ Trust', industry: 'Index Fund' },
  DIA: { base: 395, vol: 0.010, name: 'SPDR Dow Jones ETF', industry: 'Index Fund' },
  IWM: { base: 205, vol: 0.016, name: 'iShares Russell 2000', industry: 'Index Fund' },
  AAPL: { base: 198, vol: 0.018, name: 'Apple Inc.', industry: 'Technology', cap: 3050000000000, pe: 31.2, eps: 6.35, beta: 1.24 },
  MSFT: { base: 425, vol: 0.016, name: 'Microsoft Corp.', industry: 'Technology', cap: 3150000000000, pe: 35.8, eps: 11.88, beta: 0.91 },
  GOOGL: { base: 175, vol: 0.020, name: 'Alphabet Inc.', industry: 'Technology', cap: 2180000000000, pe: 25.4, eps: 6.89, beta: 1.06 },
  TSLA: { base: 245, vol: 0.035, name: 'Tesla Inc.', industry: 'Automotive', cap: 780000000000, pe: 65.2, eps: 3.76, beta: 2.05 },
  NVDA: { base: 890, vol: 0.030, name: 'NVIDIA Corp.', industry: 'Semiconductors', cap: 2200000000000, pe: 62.5, eps: 14.24, beta: 1.68 },
  AMZN: { base: 186, vol: 0.022, name: 'Amazon.com Inc.', industry: 'E-Commerce', cap: 1920000000000, pe: 58.1, eps: 3.20, beta: 1.15 },
  META: { base: 510, vol: 0.025, name: 'Meta Platforms Inc.', industry: 'Technology', cap: 1310000000000, pe: 26.3, eps: 19.39, beta: 1.22 },
  JPM: { base: 198, vol: 0.014, name: 'JPMorgan Chase', industry: 'Banking', cap: 570000000000, pe: 11.8, eps: 16.78, beta: 1.08 },
  XLK: { base: 210, vol: 0.016, name: 'Technology Select', industry: 'Technology' },
  XLF: { base: 42, vol: 0.013, name: 'Financial Select', industry: 'Financials' },
  XLV: { base: 148, vol: 0.010, name: 'Health Care Select', industry: 'Healthcare' },
  XLE: { base: 88, vol: 0.020, name: 'Energy Select', industry: 'Energy' },
  XLY: { base: 185, vol: 0.017, name: 'Consumer Disc. Select', industry: 'Consumer Discretionary' },
  XLP: { base: 78, vol: 0.008, name: 'Consumer Staples Select', industry: 'Consumer Staples' },
  XLI: { base: 118, vol: 0.012, name: 'Industrial Select', industry: 'Industrials' },
  XLB: { base: 86, vol: 0.014, name: 'Materials Select', industry: 'Materials' },
  XLRE: { base: 42, vol: 0.013, name: 'Real Estate Select', industry: 'Real Estate' },
  XLU: { base: 72, vol: 0.009, name: 'Utilities Select', industry: 'Utilities' },
  XLC: { base: 82, vol: 0.018, name: 'Communication Select', industry: 'Communication Services' },
};

// Pre-generate candle data for all symbols
const candleCache = {};
function getCandlesForSymbol(symbol) {
  if (!candleCache[symbol]) {
    const seed = STOCK_SEEDS[symbol] || { base: 100, vol: 0.02 };
    candleCache[symbol] = generateCandles(seed.base, seed.vol);
  }
  return candleCache[symbol];
}

export function getQuote(symbol) {
  const candles = getCandlesForSymbol(symbol);
  const last = candles.c.length - 1;
  const c = candles.c[last];
  const pc = candles.c[last - 1];
  const d = +(c - pc).toFixed(2);
  const dp = +((d / pc) * 100).toFixed(2);
  return {
    c, d, dp,
    h: candles.h[last],
    l: candles.l[last],
    o: candles.o[last],
    pc,
    t: candles.t[last],
  };
}

export function getCandles(symbol) {
  return getCandlesForSymbol(symbol);
}

export function getProfile(symbol) {
  const seed = STOCK_SEEDS[symbol];
  if (!seed) return { name: symbol, finnhubIndustry: 'Unknown', marketCapitalization: 0 };
  return {
    name: seed.name,
    ticker: symbol,
    finnhubIndustry: seed.industry,
    marketCapitalization: seed.cap ? seed.cap / 1e6 : 0,
    logo: '',
    weburl: '',
    ipo: '1980-12-12',
    country: 'US',
    exchange: 'NASDAQ',
  };
}

export function getMetrics(symbol) {
  const seed = STOCK_SEEDS[symbol];
  if (!seed) return { metric: {} };
  return {
    metric: {
      peBasicExclExtraTTM: seed.pe || 0,
      epsBasicExclExtraItemsTTM: seed.eps || 0,
      beta: seed.beta || 1.0,
      '52WeekHigh': (seed.base * 1.25).toFixed(2),
      '52WeekLow': (seed.base * 0.75).toFixed(2),
      dividendYieldIndicatedAnnual: (Math.random() * 2).toFixed(2),
      marketCapitalization: seed.cap ? seed.cap / 1e6 : 0,
    },
  };
}

export function getRecommendations(symbol) {
  return [
    { period: '2026-03-01', strongBuy: 12, buy: 18, hold: 8, sell: 2, strongSell: 0 },
    { period: '2026-02-01', strongBuy: 10, buy: 20, hold: 7, sell: 3, strongSell: 1 },
    { period: '2026-01-01', strongBuy: 14, buy: 16, hold: 6, sell: 2, strongSell: 0 },
  ];
}

export function getCompanyNews() {
  const now = Math.floor(Date.now() / 1000);
  return [
    { id: 1, headline: 'Fed signals potential rate adjustment amid economic shifts', source: 'Reuters', datetime: now - 3600, summary: 'Federal Reserve officials indicated they are closely monitoring economic indicators for potential policy changes.', url: '#', image: '' },
    { id: 2, headline: 'Tech sector earnings surpass expectations in latest quarter', source: 'Bloomberg', datetime: now - 7200, summary: 'Major technology companies reported strong quarterly results, driven by AI investment and cloud growth.', url: '#', image: '' },
    { id: 3, headline: 'Semiconductor demand continues to accelerate globally', source: 'CNBC', datetime: now - 14400, summary: 'The global semiconductor market sees unprecedented demand driven by AI infrastructure buildout.', url: '#', image: '' },
    { id: 4, headline: 'Consumer spending data shows resilient economy', source: 'WSJ', datetime: now - 28800, summary: 'New consumer spending figures suggest the economy remains on solid footing despite market volatility.', url: '#', image: '' },
    { id: 5, headline: 'Energy sector faces transition challenges and opportunities', source: 'Financial Times', datetime: now - 43200, summary: 'Energy companies navigate the balance between traditional operations and renewable investments.', url: '#', image: '' },
    { id: 6, headline: 'Healthcare innovation drives M&A activity', source: 'MarketWatch', datetime: now - 57600, summary: 'Pharmaceutical and biotech mergers accelerate as companies seek to bolster drug pipelines.', url: '#', image: '' },
  ];
}

export function getMarketNews() {
  return getCompanyNews();
}

export function getPeers(symbol) {
  const peers = {
    AAPL: ['MSFT', 'GOOGL', 'META', 'AMZN'],
    MSFT: ['AAPL', 'GOOGL', 'AMZN', 'META'],
    GOOGL: ['META', 'MSFT', 'AMZN', 'AAPL'],
    TSLA: ['NIO', 'RIVN', 'F', 'GM'],
    NVDA: ['AMD', 'INTC', 'AVGO', 'QCOM'],
    AMZN: ['MSFT', 'GOOGL', 'AAPL', 'META'],
    META: ['GOOGL', 'SNAP', 'PINS', 'MSFT'],
  };
  return peers[symbol] || ['AAPL', 'MSFT', 'GOOGL'];
}

const SEARCH_SYMBOLS = [
  { symbol: 'AAPL', description: 'Apple Inc.', type: 'Common Stock' },
  { symbol: 'MSFT', description: 'Microsoft Corp.', type: 'Common Stock' },
  { symbol: 'GOOGL', description: 'Alphabet Inc.', type: 'Common Stock' },
  { symbol: 'AMZN', description: 'Amazon.com Inc.', type: 'Common Stock' },
  { symbol: 'TSLA', description: 'Tesla Inc.', type: 'Common Stock' },
  { symbol: 'NVDA', description: 'NVIDIA Corp.', type: 'Common Stock' },
  { symbol: 'META', description: 'Meta Platforms Inc.', type: 'Common Stock' },
  { symbol: 'JPM', description: 'JPMorgan Chase & Co.', type: 'Common Stock' },
  { symbol: 'V', description: 'Visa Inc.', type: 'Common Stock' },
  { symbol: 'JNJ', description: 'Johnson & Johnson', type: 'Common Stock' },
  { symbol: 'WMT', description: 'Walmart Inc.', type: 'Common Stock' },
  { symbol: 'PG', description: 'Procter & Gamble Co.', type: 'Common Stock' },
  { symbol: 'MA', description: 'Mastercard Inc.', type: 'Common Stock' },
  { symbol: 'UNH', description: 'UnitedHealth Group', type: 'Common Stock' },
  { symbol: 'HD', description: 'Home Depot Inc.', type: 'Common Stock' },
  { symbol: 'DIS', description: 'Walt Disney Co.', type: 'Common Stock' },
  { symbol: 'NFLX', description: 'Netflix Inc.', type: 'Common Stock' },
  { symbol: 'PYPL', description: 'PayPal Holdings Inc.', type: 'Common Stock' },
  { symbol: 'AMD', description: 'Advanced Micro Devices', type: 'Common Stock' },
  { symbol: 'INTC', description: 'Intel Corp.', type: 'Common Stock' },
  { symbol: 'SPY', description: 'SPDR S&P 500 ETF Trust', type: 'ETF' },
  { symbol: 'QQQ', description: 'Invesco QQQ Trust', type: 'ETF' },
  { symbol: 'DIA', description: 'SPDR Dow Jones Industrial', type: 'ETF' },
  { symbol: 'IWM', description: 'iShares Russell 2000 ETF', type: 'ETF' },
  { symbol: 'XLK', description: 'Technology Select Sector', type: 'ETF' },
  { symbol: 'XLF', description: 'Financial Select Sector', type: 'ETF' },
  { symbol: 'XLV', description: 'Health Care Select Sector', type: 'ETF' },
  { symbol: 'XLE', description: 'Energy Select Sector', type: 'ETF' },
];

export function searchSymbol(query) {
  const q = query.toUpperCase();
  const results = SEARCH_SYMBOLS.filter(
    s => s.symbol.includes(q) || s.description.toUpperCase().includes(q)
  );
  return { count: results.length, result: results.slice(0, 10) };
}
