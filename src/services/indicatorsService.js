import {
  RSI,
  MACD,
  BollingerBands,
  Stochastic,
  SMA,
  ATR,
} from 'technicalindicators';

/**
 * Calculate all technical indicators from OHLCV history
 * @param {Array} history - sorted array of {time, open, high, low, close, volume}
 * @returns {Object} latest values for each indicator
 */
export function calculateIndicators(history) {
  if (!history || history.length < 30) {
    return null;
  }

  const closes = history.map(h => h.close);
  const highs = history.map(h => h.high);
  const lows = history.map(h => h.low);
  const volumes = history.map(h => h.volume || 0);

  // RSI (14)
  const rsiValues = RSI.calculate({ values: closes, period: 14 });
  const rsi = rsiValues[rsiValues.length - 1];

  // MACD (12, 26, 9)
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdLast = macdValues[macdValues.length - 1];
  const macdPrev = macdValues[macdValues.length - 2];

  const macdBullishCross = macdPrev && macdLast &&
    macdPrev.MACD < macdPrev.signal && macdLast.MACD >= macdLast.signal;
  const macdBearishCross = macdPrev && macdLast &&
    macdPrev.MACD > macdPrev.signal && macdLast.MACD <= macdLast.signal;
  const macdPositive = macdLast && macdLast.MACD > macdLast.signal;

  // Bollinger Bands (20, 2)
  const bbValues = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
  const bbLast = bbValues[bbValues.length - 1];
  const currentPrice = closes[closes.length - 1];

  const nearLowerBand = bbLast && currentPrice <= bbLast.lower * 1.01;
  const nearUpperBand = bbLast && currentPrice >= bbLast.upper * 0.99;

  // Stochastic (14, 3)
  const stochValues = Stochastic.calculate({
    high: highs, low: lows, close: closes,
    period: 14, signalPeriod: 3,
  });
  const stochLast = stochValues[stochValues.length - 1];

  // SMA 20, 50, 200
  const sma20 = SMA.calculate({ values: closes, period: 20 });
  const sma50 = closes.length >= 50 ? SMA.calculate({ values: closes, period: 50 }) : null;
  const sma200 = closes.length >= 200 ? SMA.calculate({ values: closes, period: 200 }) : null;

  // Volume average (20d)
  const vol20 = volumes.slice(-20);
  const avgVolume = vol20.reduce((a, b) => a + b, 0) / vol20.length;
  const lastVolume = volumes[volumes.length - 1];
  const volumeAboveAvg = lastVolume > avgVolume * 1.2;

  // ATR (14)
  const atrValues = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
  const atr = atrValues[atrValues.length - 1];

  return {
    rsi: parseFloat(rsi?.toFixed(2)) || null,
    macd: macdLast ? {
      macd: parseFloat(macdLast.MACD?.toFixed(4)),
      signal: parseFloat(macdLast.signal?.toFixed(4)),
      histogram: parseFloat(macdLast.histogram?.toFixed(4)),
      bullishCross: macdBullishCross,
      bearishCross: macdBearishCross,
      isPositive: macdPositive,
    } : null,
    bb: bbLast ? {
      upper: parseFloat(bbLast.upper?.toFixed(2)),
      middle: parseFloat(bbLast.middle?.toFixed(2)),
      lower: parseFloat(bbLast.lower?.toFixed(2)),
      nearLower: nearLowerBand,
      nearUpper: nearUpperBand,
    } : null,
    stoch: stochLast ? {
      k: parseFloat(stochLast.k?.toFixed(2)),
      d: parseFloat(stochLast.d?.toFixed(2)),
    } : null,
    sma20: sma20.length > 0 ? parseFloat(sma20[sma20.length - 1]?.toFixed(2)) : null,
    sma50: sma50 && sma50.length > 0 ? parseFloat(sma50[sma50.length - 1]?.toFixed(2)) : null,
    sma200: sma200 && sma200.length > 0 ? parseFloat(sma200[sma200.length - 1]?.toFixed(2)) : null,
    volume: {
      current: lastVolume,
      average: parseFloat(avgVolume?.toFixed(0)),
      aboveAvg: volumeAboveAvg,
    },
    atr: parseFloat(atr?.toFixed(2)) || null,
    price: currentPrice,
  };
}

export function getRSIHistory(history) {
  if (!history || history.length < 14) return [];
  return RSI.calculate({ values: history.map(h => h.close), period: 14 });
}

export function getBBHistory(history) {
  if (!history || history.length < 20) return [];
  return BollingerBands.calculate({ values: history.map(h => h.close), period: 20, stdDev: 2 });
}

export function getMacdHistory(history) {
  if (!history || history.length < 30) return [];
  return MACD.calculate({
    values: history.map(h => h.close),
    fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false,
  });
}
