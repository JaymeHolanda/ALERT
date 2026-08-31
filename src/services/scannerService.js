/**
 * Scanner service
 * Scans a predefined list of top B3 stocks and ranks them by buy opportunity score
 */
import { fetchQuote, fetchHistory, getErrorMessage } from './brapiService.js';
import { calculateIndicators } from './indicatorsService.js';
import { calculateSignal } from './signalService.js';
import { runBacktest } from './backtestService.js';
import { analyzeFundamentals, getFundamentalPenalty } from './fundamentalService.js';

// Top B3 stocks — Ibovespa components + dividend payers
export const SCAN_UNIVERSE = [
  { ticker: 'PETR4', name: 'Petrobras PN', sector: 'Petróleo' },
  { ticker: 'VALE3', name: 'Vale ON', sector: 'Mineração' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', sector: 'Bancário' },
  { ticker: 'BBDC4', name: 'Bradesco PN', sector: 'Bancário' },
  { ticker: 'ABEV3', name: 'Ambev ON', sector: 'Bebidas' },
  { ticker: 'WEGE3', name: 'WEG ON', sector: 'Industrial' },
  { ticker: 'RENT3', name: 'Localiza ON', sector: 'Aluguel de Veículos' },
  { ticker: 'EGIE3', name: 'Engie Brasil ON', sector: 'Energia' },
  { ticker: 'TAEE11', name: 'Taesa UNT', sector: 'Energia' },
  { ticker: 'BBSE3', name: 'BB Seguridade ON', sector: 'Seguros' },
  { ticker: 'CPLE6', name: 'Copel PNB', sector: 'Energia' },
  { ticker: 'CMIG4', name: 'Cemig PN', sector: 'Energia' },
  { ticker: 'PRIO3', name: 'PetroRio ON', sector: 'Petróleo' },
  { ticker: 'RDOR3', name: 'Rede D\'Or ON', sector: 'Saúde' },
  { ticker: 'CSAN3', name: 'Cosan ON', sector: 'Energia/Logística' },
  { ticker: 'BPAC11', name: 'BTG Pactual UNT', sector: 'Financeiro' },
  { ticker: 'EQTL3', name: 'Equatorial ON', sector: 'Energia' },
  { ticker: 'SBSP3', name: 'Sabesp ON', sector: 'Saneamento' },
  { ticker: 'SUZB3', name: 'Suzano ON', sector: 'Papel e Celulose' },
  { ticker: 'KLBN11', name: 'Klabin UNT', sector: 'Papel e Celulose' },
  { ticker: 'EMBR3', name: 'Embraer ON', sector: 'Aviação' },
  { ticker: 'RAIL3', name: 'Rumo ON', sector: 'Logística' },
  { ticker: 'VIVT3', name: 'Telefônica ON', sector: 'Telecom' },
  { ticker: 'TIMP3', name: 'TIM ON', sector: 'Telecom' },
  { ticker: 'RADL3', name: 'Raia Drogasil ON', sector: 'Farmácia' },
  { ticker: 'FLRY3', name: 'Fleury ON', sector: 'Saúde' },
  { ticker: 'HAPV3', name: 'Hapvida ON', sector: 'Saúde' },
  { ticker: 'COGN3', name: 'Cogna ON', sector: 'Educação' },
  { ticker: 'CYRE3', name: 'Cyrela ON', sector: 'Construção' },
  { ticker: 'MRVE3', name: 'MRV ON', sector: 'Construção' },
  { ticker: 'LREN3', name: 'Lojas Renner ON', sector: 'Varejo' },
  { ticker: 'SOMA3', name: 'Grupo Soma ON', sector: 'Moda' },
  { ticker: 'BRFS3', name: 'BRF ON', sector: 'Alimentos' },
  { ticker: 'JBSS3', name: 'JBS ON', sector: 'Alimentos' },
  { ticker: 'CSNA3', name: 'CSN ON', sector: 'Siderurgia' },
  { ticker: 'USIM5', name: 'Usiminas PNA', sector: 'Siderurgia' },
  { ticker: 'GOAU4', name: 'Gerdau Met PN', sector: 'Siderurgia' },
  { ticker: 'ALOS3', name: 'Allos ON', sector: 'Shopping' },
  { ticker: 'MULT3', name: 'Multiplan ON', sector: 'Shopping' },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', sector: 'Bancário' },
];

/**
 * Scan a single stock and return its opportunity data
 */
async function scanStock(stock) {
  try {
    const [quote, history] = await Promise.all([
      fetchQuote(stock.ticker),
      fetchHistory(stock.ticker, '3mo'),
    ]);

    if (!history || history.length < 30) {
      return { ...stock, error: 'Histórico insuficiente', score: -1 };
    }

    const indicators = calculateIndicators(history);
    const signal = calculateSignal(indicators);

    const price = indicators?.price || quote?.regularMarketPrice;
    const change = quote?.regularMarketChangePercent;

    // ── Fundamental analysis (uses data already in quote) ───────────
    const fundamentals = analyzeFundamentals(quote);
    const fundamentalPenalty = getFundamentalPenalty(fundamentals);

    // ── Technical opportunity score with fundamental penalty ────────
    const rawScore = calculateOpportunityScore(signal, indicators, quote);
    const opportunityScore = Math.max(0, rawScore - fundamentalPenalty);

    // ── Historical validation: run backtest on last 3 months ────────
    // This answers: "Se eu tivesse seguido esses sinais, teria lucrado?"
    const backtest = runBacktest(history, 10000);

    return {
      ...stock,
      price,
      change,
      indicators,
      signal,
      quote,
      fundamentals,
      opportunityScore,
      backtest: backtest?.error ? null : backtest,
      scannedAt: Date.now(),
      error: null,
    };
  } catch (err) {
    return { ...stock, error: getErrorMessage(err.message), score: -1 };
  }
}

/**
 * Composite opportunity score (0-100)
 * Higher = better buy opportunity right now
 */
function calculateOpportunityScore(signal, indicators, quote) {
  if (!signal || !indicators) return 0;

  let score = 0;

  // Base: buy signal score (max 7 → 50 pts)
  score += (signal.buy / signal.maxScore) * 50;

  // Bonus: strong individual signals
  if (indicators.rsi !== null) {
    if (indicators.rsi < 25) score += 15;       // very oversold
    else if (indicators.rsi < 35) score += 10;  // oversold
    else if (indicators.rsi < 45) score += 5;   // below neutral
  }

  if (indicators.macd?.bullishCross) score += 15; // just crossed — best timing
  else if (indicators.macd?.isPositive) score += 5;

  if (indicators.bb?.nearLower) score += 10; // touching lower band

  if (indicators.stoch?.k < 20) score += 10;
  else if (indicators.stoch?.k < 30) score += 5;

  if (indicators.volume?.aboveAvg) score += 5; // volume confirming

  // Penalty: sell signals already triggered
  score -= (signal.sell / signal.maxScore) * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Scan all stocks in the universe with a delay between requests
 * @param {Function} onProgress - callback(stock, index, total)
 * @param {number} delayMs - delay between requests
 */
export async function scanAll(onProgress, delayMs = 800) {
  const results = [];

  for (let i = 0; i < SCAN_UNIVERSE.length; i++) {
    const stock = SCAN_UNIVERSE[i];
    const result = await scanStock(stock);
    results.push(result);
    if (onProgress) onProgress(result, i + 1, SCAN_UNIVERSE.length);
    if (i < SCAN_UNIVERSE.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Get top N buy opportunities from scan results
 */
export function getTopOpportunities(results, n = 10) {
  return results
    .filter(r => !r.error && r.opportunityScore > 20)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, n);
}

/**
 * Get opportunity tier label
 */
export function getOpportunityTier(score) {
  if (score >= 70) return { label: '🔥 Excelente', color: '#00e676', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.3)' };
  if (score >= 50) return { label: '⚡ Boa', color: '#ffcc02', bg: 'rgba(255,204,2,0.1)', border: 'rgba(255,204,2,0.3)' };
  if (score >= 30) return { label: '👀 Moderada', color: '#4fc3f7', bg: 'rgba(79,195,247,0.1)', border: 'rgba(79,195,247,0.3)' };
  return { label: '😐 Fraca', color: 'var(--text-muted)', bg: 'var(--bg-input)', border: 'var(--border)' };
}

/**
 * Classify a backtest result into a verdict for display on the Radar card
 * Considers: total return, beats buy-and-hold, win rate, number of trades
 */
export function getBacktestVerdict(backtest) {
  if (!backtest || backtest.error) {
    return { label: 'Sem dados', icon: '❓', color: 'var(--text-muted)', detail: '' };
  }

  const { totalReturn, buyHoldReturn, winRate, totalTrades, vsHold } = backtest;

  // Not enough trades to be statistically meaningful
  if (totalTrades === 0) {
    return {
      label: 'Sem operações',
      icon: '⚪',
      color: 'var(--text-muted)',
      detail: 'Nenhum sinal gerado no período.',
    };
  }

  if (totalReturn > 5 && vsHold > 0 && winRate >= 55) {
    return {
      label: 'Funcionou bem',
      icon: '✅',
      color: '#00e676',
      bg: 'rgba(0,230,118,0.08)',
      border: 'rgba(0,230,118,0.2)',
      detail: `+${totalReturn}% em ${totalTrades} op. · acerto ${winRate}% · bateu hold em ${vsHold > 0 ? '+' : ''}${vsHold}%`,
    };
  }

  if (totalReturn > 0 && winRate >= 45) {
    return {
      label: 'Resultado positivo',
      icon: '🟡',
      color: '#ffcc02',
      bg: 'rgba(255,204,2,0.08)',
      border: 'rgba(255,204,2,0.2)',
      detail: `+${totalReturn}% em ${totalTrades} op. · acerto ${winRate}%`,
    };
  }

  if (totalReturn < 0) {
    return {
      label: 'Teria dado prejuízo',
      icon: '❌',
      color: '#ff3d71',
      bg: 'rgba(255,61,113,0.08)',
      border: 'rgba(255,61,113,0.2)',
      detail: `${totalReturn}% em ${totalTrades} op. · acerto ${winRate}%`,
    };
  }

  return {
    label: 'Resultado neutro',
    icon: '😐',
    color: 'var(--text-muted)',
    bg: 'var(--bg-input)',
    border: 'var(--border)',
    detail: `${totalReturn}% em ${totalTrades} op.`,
  };
}
