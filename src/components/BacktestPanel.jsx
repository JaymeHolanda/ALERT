import { useState, useMemo } from 'react';
import { runBacktest } from '../services/backtestService.js';
import { FlaskConical, TrendingUp, TrendingDown, RefreshCw, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

function MetricCard({ label, value, color = 'white', prefix = '', suffix = '' }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${color}`}>{prefix}{value}{suffix}</div>
    </div>
  );
}

function ReasonsList({ reasons, type }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {reasons.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: r.met
              ? type === 'buy' ? 'var(--green-bg)' : 'var(--red-bg)'
              : 'var(--bg-input)',
            borderRadius: 6,
            border: `1px solid ${r.met ? (type === 'buy' ? 'var(--green-border)' : 'var(--red-border)') : 'var(--border)'}`,
            fontSize: 13,
          }}
        >
          {r.met
            ? <CheckCircle size={14} color={type === 'buy' ? 'var(--green)' : 'var(--red)'} />
            : <XCircle size={14} color="var(--text-muted)" />
          }
          <span style={{ color: r.met ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {r.label}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>
            +{r.weight}pts
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BacktestPanel({ portfolio, stockData, loading, selectedTicker, onSelectTicker, onRefreshStock }) {
  const [capital, setCapital] = useState(10000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const ticker = selectedTicker || portfolio[0]?.ticker;
  const data = ticker ? stockData[ticker] : null;

  const handleRunBacktest = () => {
    if (!data?.history) return;
    setRunning(true);
    setTimeout(() => {
      const res = runBacktest(data.history, capital);
      setResult(res);
      setRunning(false);
    }, 50);
  };

  const isPositive = result && result.totalReturn >= 0;
  const beatsHold = result && result.vsHold > 0;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Análise & Backtesting</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Veja os detalhes dos sinais e simule resultados históricos
          </p>
        </div>
      </div>

      {portfolio.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FlaskConical size={28} /></div>
          <div className="empty-title">Nenhuma ação monitorada</div>
          <div className="empty-desc">Adicione ações no Dashboard primeiro.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          {/* Sidebar: stock selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="card-title" style={{ marginBottom: 8 }}>Selecionar Ação</div>
            {portfolio.map(stock => {
              const d = stockData[stock.ticker];
              const sig = d?.signal;
              const isSelected = stock.ticker === ticker;
              return (
                <button
                  key={stock.ticker}
                  id={`select-${stock.ticker}`}
                  onClick={() => { onSelectTicker(stock.ticker); setResult(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isSelected ? 'var(--blue-bg)' : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'rgba(79,195,247,0.3)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    color: isSelected ? 'var(--blue)' : 'var(--text-primary)',
                    fontSize: 14,
                  }}>
                    {stock.ticker}
                  </span>
                  {sig && (
                    <span className={`badge badge-${sig.signal === 'buy' ? 'buy' : sig.signal === 'sell' ? 'sell' : sig.signal.startsWith('watch') ? 'watch' : 'neutral'}`}
                      style={{ fontSize: 10, padding: '2px 6px' }}>
                      {sig.buy}/{sig.maxScore} · {sig.sell}/{sig.maxScore}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Signal detail */}
            {data?.signal && data?.indicators && (
              <>
                {/* Current indicators */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Indicadores Atuais — {ticker}</div>
                    <button
                      id={`refresh-detail-${ticker}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => onRefreshStock(ticker)}
                      disabled={loading[ticker]}
                    >
                      <RefreshCw size={13} /> Atualizar
                    </button>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">RSI (14)</div>
                      <div className={`stat-value ${data.indicators.rsi < 35 ? 'green' : data.indicators.rsi > 65 ? 'red' : 'white'}`}>
                        {data.indicators.rsi ?? '--'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">MACD</div>
                      <div className={`stat-value ${data.indicators.macd?.isPositive ? 'green' : 'red'}`}>
                        {data.indicators.macd?.isPositive ? '▲ Positivo' : '▼ Negativo'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Estocástico</div>
                      <div className={`stat-value ${data.indicators.stoch?.k < 25 ? 'green' : data.indicators.stoch?.k > 75 ? 'red' : 'white'}`}>
                        {data.indicators.stoch?.k?.toFixed(1) ?? '--'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">BB Lower</div>
                      <div className="stat-value blue">
                        {data.indicators.bb?.lower ? `R$ ${data.indicators.bb.lower}` : '--'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">BB Upper</div>
                      <div className="stat-value blue">
                        {data.indicators.bb?.upper ? `R$ ${data.indicators.bb.upper}` : '--'}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">ATR</div>
                      <div className="stat-value white">
                        {data.indicators.atr ?? '--'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buy / Sell reasons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title" style={{ color: 'var(--green)' }}>
                        🟢 Critérios de Compra — {data.signal.buy}/{data.signal.maxScore}
                      </div>
                    </div>
                    <ReasonsList reasons={data.signal.buyReasons} type="buy" />
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title" style={{ color: 'var(--red)' }}>
                        🔴 Critérios de Venda — {data.signal.sell}/{data.signal.maxScore}
                      </div>
                    </div>
                    <ReasonsList reasons={data.signal.sellReasons} type="sell" />
                  </div>
                </div>
              </>
            )}

            {/* Backtest section */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <FlaskConical size={14} style={{ display: 'inline', marginRight: 6 }} />
                  Backtesting — Últimos 3 Meses
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Capital inicial (R$)</label>
                  <input
                    id="backtest-capital"
                    className="form-input"
                    type="number"
                    value={capital}
                    onChange={e => setCapital(Number(e.target.value))}
                    min={100}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
                <div style={{ paddingTop: 20 }}>
                  <button
                    id="run-backtest"
                    className="btn btn-primary"
                    onClick={handleRunBacktest}
                    disabled={running || !data?.history || loading[ticker]}
                  >
                    {running ? 'Simulando...' : <><ArrowRight size={14} /> Simular</>}
                  </button>
                </div>
              </div>

              {!data?.history && !loading[ticker] && (
                <div className="alert alert-info">
                  Selecione uma ação com dados carregados para rodar o backtesting.
                </div>
              )}

              {result?.error && (
                <div className="alert alert-warning">{result.error}</div>
              )}

              {result && !result.error && (
                <div>
                  {/* Summary metrics */}
                  <div className="backtest-metrics">
                    <MetricCard
                      label="Retorno da Estratégia"
                      value={`${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn}%`}
                      color={result.totalReturn >= 0 ? 'green' : 'red'}
                    />
                    <MetricCard
                      label="Retorno Buy-and-Hold"
                      value={`${result.buyHoldReturn >= 0 ? '+' : ''}${result.buyHoldReturn}%`}
                      color={result.buyHoldReturn >= 0 ? 'green' : 'red'}
                    />
                    <MetricCard
                      label="Vs. Buy-and-Hold"
                      value={`${result.vsHold >= 0 ? '+' : ''}${result.vsHold}%`}
                      color={beatsHold ? 'green' : 'red'}
                    />
                    <MetricCard
                      label="Capital Final"
                      value={`R$ ${result.finalCapital.toLocaleString('pt-BR')}`}
                      color="blue"
                    />
                    <MetricCard
                      label="Taxa de Acerto"
                      value={`${result.winRate}%`}
                      color={result.winRate >= 50 ? 'green' : 'red'}
                    />
                    <MetricCard
                      label="Drawdown Máximo"
                      value={`-${result.maxDrawdown}%`}
                      color="red"
                    />
                    <MetricCard
                      label="Total de Operações"
                      value={result.totalTrades}
                      color="white"
                    />
                    <MetricCard
                      label="Ganho Médio"
                      value={`${result.avgProfitPct >= 0 ? '+' : ''}${result.avgProfitPct}%`}
                      color={result.avgProfitPct >= 0 ? 'green' : 'red'}
                    />
                  </div>

                  {/* Verdict */}
                  <div className={`alert ${beatsHold ? 'alert-success' : result.totalReturn >= 0 ? 'alert-warning' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                    {beatsHold
                      ? `✅ A estratégia superou o buy-and-hold em ${result.vsHold}%! Os sinais foram rentáveis neste período.`
                      : result.totalReturn >= 0
                      ? `⚠️ A estratégia foi lucrativa (+${result.totalReturn}%), mas o buy-and-hold teria sido melhor (${result.buyHoldReturn}%).`
                      : `❌ A estratégia teria gerado perda de ${Math.abs(result.totalReturn)}% neste período. Ajuste os parâmetros.`
                    }
                  </div>

                  {/* Trades table */}
                  {result.trades.length > 0 && (
                    <div>
                      <div className="card-title" style={{ marginBottom: 10 }}>Operações Simuladas</div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Tipo</th>
                              <th>Data</th>
                              <th>Preço</th>
                              <th>Qtd</th>
                              <th>Valor</th>
                              <th>Resultado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.trades.map((t, i) => (
                              <tr key={i}>
                                <td>
                                  <span className={`badge badge-${t.type === 'buy' ? 'buy' : 'sell'}`} style={{ fontSize: 11 }}>
                                    {t.type === 'buy' ? '🟢 Compra' : '🔴 Venda'}
                                  </span>
                                </td>
                                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{t.date}</td>
                                <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>R$ {t.price?.toFixed(2)}</td>
                                <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{t.shares}</td>
                                <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                  R$ {(t.cost || t.proceeds)?.toLocaleString('pt-BR')}
                                </td>
                                <td style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                  color: t.profit > 0 ? 'var(--green)' : t.profit < 0 ? 'var(--red)' : 'var(--text-muted)',
                                  fontWeight: 600,
                                }}>
                                  {t.profit !== undefined
                                    ? `${t.profit >= 0 ? '+' : ''}R$ ${t.profit?.toFixed(2)} (${t.profitPct >= 0 ? '+' : ''}${t.profitPct}%)`
                                    : '--'
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
