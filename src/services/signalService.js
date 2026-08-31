/**
 * Signal scoring service
 * Returns buy/sell scores and reasons for each condition
 */

const BUY_THRESHOLD = 4;
const SELL_THRESHOLD = 4;

export function calculateSignal(indicators, entryPrice = null) {
  if (!indicators) return { buy: 0, sell: 0, signal: 'neutral', reasons: [] };

  const { rsi, macd, bb, stoch, volume } = indicators;
  const price = indicators.price;

  let buyScore = 0;
  let sellScore = 0;
  const buyReasons = [];
  const sellReasons = [];

  // ── BUY CONDITIONS ──────────────────────────────────────────────
  if (rsi !== null && rsi < 35) {
    buyScore += 2;
    buyReasons.push({ label: `RSI ${rsi} < 35`, weight: 2, met: true });
  } else {
    buyReasons.push({ label: `RSI ${rsi ?? '-'} (precisa < 35)`, weight: 2, met: false });
  }

  if (macd?.bullishCross) {
    buyScore += 2;
    buyReasons.push({ label: 'MACD cruzou para positivo', weight: 2, met: true });
  } else if (macd?.isPositive) {
    buyScore += 1;
    buyReasons.push({ label: 'MACD positivo (sem cruzamento)', weight: 1, met: true });
  } else {
    buyReasons.push({ label: 'MACD (precisa cruzar positivo)', weight: 2, met: false });
  }

  if (bb?.nearLower) {
    buyScore += 1;
    buyReasons.push({ label: 'Preço na Banda Inferior (BB)', weight: 1, met: true });
  } else {
    buyReasons.push({ label: 'Banda Bollinger inferior (não atingida)', weight: 1, met: false });
  }

  if (stoch?.k !== null && stoch?.k < 25) {
    buyScore += 1;
    buyReasons.push({ label: `Estocástico ${stoch.k} < 25`, weight: 1, met: true });
  } else {
    buyReasons.push({ label: `Estocástico ${stoch?.k ?? '-'} (precisa < 25)`, weight: 1, met: false });
  }

  if (volume?.aboveAvg) {
    buyScore += 1;
    buyReasons.push({ label: 'Volume acima da média (20d)', weight: 1, met: true });
  } else {
    buyReasons.push({ label: 'Volume abaixo da média', weight: 1, met: false });
  }

  // ── SELL CONDITIONS ──────────────────────────────────────────────
  if (rsi !== null && rsi > 65) {
    sellScore += 2;
    sellReasons.push({ label: `RSI ${rsi} > 65`, weight: 2, met: true });
  } else {
    sellReasons.push({ label: `RSI ${rsi ?? '-'} (precisa > 65)`, weight: 2, met: false });
  }

  if (macd?.bearishCross) {
    sellScore += 2;
    sellReasons.push({ label: 'MACD cruzou para negativo', weight: 2, met: true });
  } else if (macd && !macd.isPositive) {
    sellScore += 1;
    sellReasons.push({ label: 'MACD negativo (sem cruzamento)', weight: 1, met: true });
  } else {
    sellReasons.push({ label: 'MACD (precisa cruzar negativo)', weight: 2, met: false });
  }

  if (bb?.nearUpper) {
    sellScore += 1;
    sellReasons.push({ label: 'Preço na Banda Superior (BB)', weight: 1, met: true });
  } else {
    sellReasons.push({ label: 'Banda Bollinger superior (não atingida)', weight: 1, met: false });
  }

  if (stoch?.k !== null && stoch?.k > 75) {
    sellScore += 1;
    sellReasons.push({ label: `Estocástico ${stoch.k} > 75`, weight: 1, met: true });
  } else {
    sellReasons.push({ label: `Estocástico ${stoch?.k ?? '-'} (precisa > 75)`, weight: 1, met: false });
  }

  // Stop loss check (only if we have an entry price)
  if (entryPrice && price && price < entryPrice * 0.92) {
    sellScore += 1;
    sellReasons.push({ label: `Stop Loss ativado (queda > 8%)`, weight: 1, met: true });
  } else {
    sellReasons.push({ label: 'Stop Loss (queda > 8%)', weight: 1, met: false });
  }

  // ── DETERMINE SIGNAL ────────────────────────────────────────────
  let signal = 'neutral';
  if (buyScore >= BUY_THRESHOLD && buyScore > sellScore) signal = 'buy';
  else if (sellScore >= SELL_THRESHOLD && sellScore > buyScore) signal = 'sell';
  else if (buyScore >= 2 && buyScore > sellScore) signal = 'watch_buy';
  else if (sellScore >= 2 && sellScore > buyScore) signal = 'watch_sell';

  return {
    buy: buyScore,
    sell: sellScore,
    maxScore: 7,
    signal,
    buyReasons,
    sellReasons,
    threshold: BUY_THRESHOLD,
  };
}

export function getSignalLabel(signal) {
  const map = {
    buy: { label: '🟢 COMPRAR', color: '#00c853' },
    sell: { label: '🔴 VENDER', color: '#ff1744' },
    watch_buy: { label: '👀 Observar (Alta)', color: '#ffab00' },
    watch_sell: { label: '⚠️ Atenção (Baixa)', color: '#ff6d00' },
    neutral: { label: '⚪ Neutro', color: '#90a4ae' },
  };
  return map[signal] || map.neutral;
}

export { BUY_THRESHOLD, SELL_THRESHOLD };
