import * as mockData from './mockData';

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';
export const isDemoMode = !API_KEY;

// ── Rate Limiter (token bucket, 60 tokens, 1/sec refill) ──
class RateLimiter {
  constructor(maxTokens, refillRate) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
    this.queue = [];
  }
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
  async acquire() {
    this.refill();
    if (this.tokens >= 1) { this.tokens--; return; }
    return new Promise(resolve => {
      this.queue.push(resolve);
      setTimeout(() => this._processQueue(), 1000);
    });
  }
  _processQueue() {
    this.refill();
    while (this.queue.length > 0 && this.tokens >= 1) {
      this.tokens--;
      this.queue.shift()();
    }
  }
}
const limiter = new RateLimiter(60, 1);

// ── Cache ──
const cache = new Map();
const TTL = {
  quote: 15_000,
  candle: 300_000,
  profile: 3600_000,
  news: 120_000,
  recommendation: 3600_000,
  metric: 3600_000,
  search: 60_000,
  peers: 3600_000,
};

async function cachedFetch(endpoint, params, ttlKey) {
  const key = `${endpoint}:${JSON.stringify(params)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL[ttlKey]) return cached.data;

  await limiter.acquire();
  const qs = new URLSearchParams({ ...params, token: API_KEY });
  const res = await fetch(`${BASE_URL}${endpoint}?${qs}`);
  if (res.status === 429) {
    const old = cache.get(key);
    if (old) return old.data;
    throw new Error('Rate limit exceeded');
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// ── Public API ──

export async function getQuote(symbol) {
  if (isDemoMode) return mockData.getQuote(symbol);
  return cachedFetch('/quote', { symbol }, 'quote');
}

export async function getCandles(symbol, resolution = 'D', from, to) {
  if (isDemoMode) return mockData.getCandles(symbol);
  if (!from) {
    to = Math.floor(Date.now() / 1000);
    from = to - 365 * 86400;
  }
  return cachedFetch('/stock/candle', { symbol, resolution, from, to }, 'candle');
}

export async function getCompanyProfile(symbol) {
  if (isDemoMode) return mockData.getProfile(symbol);
  return cachedFetch('/stock/profile2', { symbol }, 'profile');
}

export async function getCompanyNews(symbol, from, to) {
  if (isDemoMode) return mockData.getCompanyNews(symbol);
  if (!from) {
    const now = new Date();
    to = now.toISOString().split('T')[0];
    const past = new Date(now - 7 * 86400000);
    from = past.toISOString().split('T')[0];
  }
  return cachedFetch('/company-news', { symbol, from, to }, 'news');
}

export async function getMarketNews() {
  if (isDemoMode) return mockData.getMarketNews();
  return cachedFetch('/news', { category: 'general' }, 'news');
}

export async function getRecommendations(symbol) {
  if (isDemoMode) return mockData.getRecommendations(symbol);
  return cachedFetch('/stock/recommendation', { symbol }, 'recommendation');
}

export async function getMetrics(symbol) {
  if (isDemoMode) return mockData.getMetrics(symbol);
  return cachedFetch('/stock/metric', { symbol, metric: 'all' }, 'metric');
}

export async function searchSymbol(query) {
  if (isDemoMode) return mockData.searchSymbol(query);
  return cachedFetch('/search', { q: query }, 'search');
}

export async function getPeers(symbol) {
  if (isDemoMode) return mockData.getPeers(symbol);
  return cachedFetch('/stock/peers', { symbol }, 'peers');
}

// Batch fetch quotes for multiple symbols
export async function getQuotes(symbols) {
  const results = {};
  const promises = symbols.map(async (s) => {
    try {
      results[s] = await getQuote(s);
    } catch { results[s] = null; }
  });
  await Promise.all(promises);
  return results;
}
