const BRAPI_BASE = 'https://brapi.dev/api';

// Always read from localStorage at call time so changes in Settings take effect immediately
function getToken() {
  return localStorage.getItem('brapi_token') || '';
}

export function setToken(token) {
  localStorage.setItem('brapi_token', token.trim());
}

export function hasBrapiToken() {
  return !!getToken();
}

function buildUrl(path, params = {}) {
  const url = new URL(`${BRAPI_BASE}${path}`);
  const token = getToken();
  if (token) url.searchParams.set('token', token);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function handleBrapiError(res) {
  if (res.status === 401) {
    throw new Error('TOKEN_REQUIRED');
  }
  if (res.status === 404) {
    throw new Error('TICKER_NOT_FOUND');
  }
  if (res.status === 429) {
    throw new Error('RATE_LIMIT');
  }
  throw new Error(`API_ERROR_${res.status}`);
}

/**
 * Get current quote + fundamental data for a ticker
 */
export async function fetchQuote(ticker) {
  const url = buildUrl(`/quote/${ticker}`, {
    range: '1mo',
    interval: '1d',
    fundamental: 'true',
    dividends: 'false',
  });

  const res = await fetch(url);
  if (!res.ok) handleBrapiError(res);

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('TICKER_NOT_FOUND');
  }

  return data.results[0];
}

/**
 * Get historical OHLCV data for indicator calculation
 * range: '3mo' = last 3 months (free tier max)
 */
export async function fetchHistory(ticker, range = '3mo') {
  const url = buildUrl(`/quote/${ticker}`, {
    range,
    interval: '1d',
    fundamental: 'false',
  });

  const res = await fetch(url);
  if (!res.ok) handleBrapiError(res);

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('TICKER_NOT_FOUND');
  }

  const result = data.results[0];
  const prices = result.historicalDataPrice || [];

  return prices
    .filter(p => p.close !== null && p.open !== null)
    .map(p => ({
      time: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * Translate error codes to user-friendly Portuguese messages
 */
export function getErrorMessage(errorMessage) {
  const map = {
    'TOKEN_REQUIRED': 'Token da brapi.dev necessário. Configure em Configurações.',
    'TICKER_NOT_FOUND': 'Ticker não encontrado na B3.',
    'RATE_LIMIT': 'Limite de requisições atingido. Aguarde alguns minutos.',
  };
  if (map[errorMessage]) return map[errorMessage];
  if (errorMessage?.startsWith('API_ERROR_')) return `Erro na API (${errorMessage.replace('API_ERROR_', '')})`;
  return errorMessage || 'Erro desconhecido';
}
