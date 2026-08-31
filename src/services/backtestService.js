import { calculateIndicators } from './indicatorsService.js';
import { calculateSignal } from './signalService.js';

/**
 * Run a simplified backtest over historical data
 * Simulates buy/sell signals and calculates performance metrics
 *
 * @param {Array} history - full OHLCV history (sorted ascending)
 * @param {number} initialCapital - starting capital in BRL
 * @returns {Object} backtest results
 */
export function runBacktest(history, initialCapital = 10000) {
  if (!history || history.length < 50) {
    return { error: 'Histórico insuficiente para backtesting (mínimo 50 dias)' };
  }

  const trades = [];
  let capital = initialCapital;
  let shares = 0;
  let entryPrice = null;
  let entryDate = null;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  const equityCurve = [];

  // We need at least 26 candles to calculate MACD, so start from index 30
  const startIdx = 30;

  for (let i = startIdx; i < history.length; i++) {
    const slice = history.slice(0, i + 1);
    const indicators = calculateIndicators(slice);
    if (!indicators) continue;

    const signal = calculateSignal(indicators, entryPrice);
    const currentPrice = history[i].close;
    const currentTime = history[i].time;

    // Calculate current portfolio value
    const portfolioValue = shares > 0
      ? capital + shares * currentPrice
      : capital;

    equityCurve.push({
      time: currentTime,
      value: parseFloat(portfolioValue.toFixed(2)),
    });

    // Update max drawdown
    if (portfolioValue > peakCapital) peakCapital = portfolioValue;
    const drawdown = ((peakCapital - portfolioValue) / peakCapital) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    // BUY signal — only if we don't hold shares
    if (signal.signal === 'buy' && shares === 0 && capital > 0) {
      shares = Math.floor(capital / currentPrice);
      if (shares > 0) {
        const cost = shares * currentPrice;
        capital -= cost;
        entryPrice = currentPrice;
        entryDate = currentTime;
        trades.push({
          type: 'buy',
          date: new Date(currentTime * 1000).toLocaleDateString('pt-BR'),
          price: currentPrice,
          shares,
          cost: parseFloat(cost.toFixed(2)),
        });
      }
    }

    // SELL signal — only if we hold shares
    else if ((signal.signal === 'sell' || signal.signal === 'watch_sell') && shares > 0) {
      const proceeds = shares * currentPrice;
      const profit = proceeds - (shares * entryPrice);
      const profitPct = ((currentPrice - entryPrice) / entryPrice) * 100;
      capital += proceeds;

      trades.push({
        type: 'sell',
        date: new Date(currentTime * 1000).toLocaleDateString('pt-BR'),
        price: currentPrice,
        shares,
        proceeds: parseFloat(proceeds.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitPct: parseFloat(profitPct.toFixed(2)),
        entryPrice,
        entryDate: new Date(entryDate * 1000).toLocaleDateString('pt-BR'),
      });

      shares = 0;
      entryPrice = null;
      entryDate = null;
    }
  }

  // If still holding at the end, force close
  if (shares > 0) {
    const lastPrice = history[history.length - 1].close;
    capital += shares * lastPrice;
    shares = 0;
  }

  // Metrics
  const finalCapital = capital;
  const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;

  // Buy and hold comparison
  const buyHoldShares = Math.floor(initialCapital / history[startIdx].close);
  const buyHoldValue = buyHoldShares * history[history.length - 1].close +
    (initialCapital - buyHoldShares * history[startIdx].close);
  const buyHoldReturn = ((buyHoldValue - initialCapital) / initialCapital) * 100;

  const sellTrades = trades.filter(t => t.type === 'sell');
  const winningTrades = sellTrades.filter(t => t.profit > 0);
  const winRate = sellTrades.length > 0
    ? (winningTrades.length / sellTrades.length) * 100
    : 0;

  const avgProfit = sellTrades.length > 0
    ? sellTrades.reduce((acc, t) => acc + t.profitPct, 0) / sellTrades.length
    : 0;

  return {
    initialCapital,
    finalCapital: parseFloat(finalCapital.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    buyHoldReturn: parseFloat(buyHoldReturn.toFixed(2)),
    buyHoldValue: parseFloat(buyHoldValue.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    totalTrades: sellTrades.length,
    winningTrades: winningTrades.length,
    winRate: parseFloat(winRate.toFixed(1)),
    avgProfitPct: parseFloat(avgProfit.toFixed(2)),
    trades,
    equityCurve,
    vsHold: parseFloat((totalReturn - buyHoldReturn).toFixed(2)),
  };
}
