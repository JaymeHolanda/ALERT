import { useState, useCallback } from 'react';
import { scanAll, getTopOpportunities, getOpportunityTier, getBacktestVerdict, SCAN_UNIVERSE } from '../services/scannerService.js';
import { addStock, getPortfolio } from '../store/portfolioStore.js';
import { Radar, Zap, TrendingUp, TrendingDown, Plus, RefreshCw, Clock, BarChart2, History } from 'lucide-react';

function OpportunityCard({ result, onAdd, alreadyAdded }) {
  const tier = getOpportunityTier(result.opportunityScore);
  const { indicators, signal } = result;
  const change = result.change;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${tier.border}`,
      borderRadius: 'var(--radius)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Top glow bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800, fontSize: 18, color: 'var(--text-primary)',
            }}>{result.ticker}</span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 100,
              background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
              fontWeight: 600,
            }}>{tier.label}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {result.name} · {result.sector}
          </div>
        </div>

        {/* Opportunity score ring */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: '50%',
            background: `conic-gradient(${tier.color} ${result.opportunityScore * 3.6}deg, var(--border) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13, fontWeight: 700, color: tier.color,
              }}>{result.opportunityScore}</span>
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>SCORE</div>
        </div>
      </div>

      {/* Price + change */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20, fontWeight: 700, color: 'var(--text-primary)',
        }}>
          R$ {result.price?.toFixed(2)}
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 13, fontWeight: 600,
          color: change >= 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change >= 0 ? '+' : ''}{change?.toFixed(2)}% hoje
        </span>
      </div>

      {/* Signal scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Score Compra
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden',
            }}>
              <div style={{
                width: `${(signal.buy / signal.maxScore) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00c853, #00e676)',
                borderRadius: 100,
                transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            </div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
              color: 'var(--green)',
            }}>{signal.buy}/{signal.maxScore}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Score Venda
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden',
            }}>
              <div style={{
                width: `${(signal.sell / signal.maxScore) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff1744, #ff3d71)',
                borderRadius: 100,
              }} />
            </div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
              color: 'var(--red)',
            }}>{signal.sell}/{signal.maxScore}</span>
          </div>
        </div>
      </div>

      {/* Key indicators */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {indicators?.rsi !== null && (
          <div className="ind-chip">
            <span className="ind-label">RSI</span>
            <span style={{ color: indicators.rsi < 35 ? 'var(--green)' : indicators.rsi > 65 ? 'var(--red)' : 'var(--text-secondary)' }}>
              {indicators.rsi}
            </span>
          </div>
        )}
        {indicators?.macd && (
          <div className="ind-chip">
            <span className="ind-label">MACD</span>
            <span style={{ color: indicators.macd.bullishCross ? 'var(--green)' : indicators.macd.isPositive ? '#7ddc8e' : 'var(--red)' }}>
              {indicators.macd.bullishCross ? '⚡ cross' : indicators.macd.isPositive ? '▲ pos' : '▼ neg'}
            </span>
          </div>
        )}
        {indicators?.stoch && (
          <div className="ind-chip">
            <span className="ind-label">Stoch</span>
            <span style={{ color: indicators.stoch.k < 25 ? 'var(--green)' : indicators.stoch.k > 75 ? 'var(--red)' : 'var(--text-secondary)' }}>
              {indicators.stoch.k?.toFixed(0)}
            </span>
          </div>
        )}
        {indicators?.bb?.nearLower && (
          <div className="ind-chip" style={{ borderColor: 'var(--green-border)', color: 'var(--green)' }}>
            BB ↙ baixo
          </div>
        )}
        {indicators?.volume?.aboveAvg && (
          <div className="ind-chip" style={{ borderColor: 'rgba(92,107,192,0.3)', color: 'var(--accent-bright)' }}>
            Vol ↑
          </div>
        )}
      </div>

      {/* Why buy explanation */}
      <div style={{
        background: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px',
        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Por que agora?</strong>{' '}
        {buildExplanation(result)}
      </div>

      {/* ── Historical validation block ─────────────────────── */}
      {(() => {
        const verdict = getBacktestVerdict(result.backtest);
        const bt = result.backtest;
        return (
          <div style={{
            borderRadius: 8,
            border: `1px solid ${verdict.border || 'var(--border)'}`,
            background: verdict.bg || 'var(--bg-input)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <History size={13} color={verdict.color} />
              <span style={{ fontSize: 11, fontWeight: 700, color: verdict.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Validação histórica (3 meses)
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: verdict.color,
              }}>{verdict.icon} {verdict.label}</span>
            </div>
            {verdict.detail && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {verdict.detail}
              </div>
            )}
            {bt && bt.totalTrades > 0 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: bt.totalReturn >= 0 ? '#00e676' : '#ff3d71' }}>
                    {bt.totalReturn >= 0 ? '+' : ''}{bt.totalReturn}%
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>Estratégia</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: bt.buyHoldReturn >= 0 ? 'var(--blue)' : '#ff3d71' }}>
                    {bt.buyHoldReturn >= 0 ? '+' : ''}{bt.buyHoldReturn}%
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>Buy & Hold</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: bt.winRate >= 50 ? '#00e676' : '#ff3d71' }}>
                    {bt.winRate}%
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>Acerto</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Fundamental health block ──────────────────────────── */}
      {result.fundamentals && (() => {
        const f = result.fundamentals;
        const isDanger = f.rating === 'danger' || f.rating === 'critical';
        const isWeak   = f.rating === 'weak' || f.rating === 'moderate';
        const isHealthy = f.rating === 'healthy';
        const bg     = isDanger ? 'rgba(255,61,113,0.06)' : isWeak ? 'rgba(255,204,2,0.06)' : isHealthy ? 'rgba(0,230,118,0.05)' : 'var(--bg-input)';
        const border = isDanger ? 'rgba(255,61,113,0.25)' : isWeak ? 'rgba(255,204,2,0.2)' : isHealthy ? 'rgba(0,230,118,0.2)' : 'var(--border)';
        return (
          <div style={{ borderRadius: 8, border: `1px solid ${border}`, background: bg, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.ratingColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📋 Saúde financeira
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.ratingColor }}>{f.ratingLabel}</span>
            </div>

            {/* Lucro / Prejuízo badge — destaque principal */}
            {(() => {
              const pl  = f.raw.pl;
              const eps = f.raw.eps;
              // Profitable: P/L exists and > 0, OR EPS > 0
              const isProfit = (pl !== null && pl !== undefined && pl > 0) ||
                               (eps !== null && eps !== undefined && eps > 0);
              const isLoss   = (pl !== null && pl !== undefined && pl < 0) ||
                               (eps !== null && eps !== undefined && eps < 0 && (pl === null || pl === undefined));
              if (!isProfit && !isLoss) return null;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '7px 0', borderRadius: 7,
                  background: isProfit ? 'rgba(0,230,118,0.12)' : 'rgba(255,61,113,0.12)',
                  border: `1px solid ${isProfit ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,113,0.3)'}`,
                  gap: 6,
                }}>
                  <span style={{ fontSize: 16 }}>{isProfit ? '✅' : '❌'}</span>
                  <span style={{
                    fontWeight: 700, fontSize: 13,
                    color: isProfit ? '#00e676' : '#ff3d71',
                  }}>
                    Empresa {isProfit ? 'com lucro' : 'com prejuízo'}
                  </span>
                  {pl !== null && pl !== undefined && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      · P/L {pl.toFixed(1)}
                    </span>
                  )}
                  {eps !== null && eps !== undefined && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      · LPA R$ {eps.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Metrics row */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'ROE', value: f.raw.roe !== null && f.raw.roe !== undefined ? `${f.raw.roe.toFixed(1)}%` : '--', color: f.raw.roe < 0 ? '#ff3d71' : f.raw.roe < 5 ? '#ffcc02' : '#00e676' },
                { label: 'P/L', value: f.raw.pl !== null && f.raw.pl !== undefined ? f.raw.pl.toFixed(1) : '--', color: f.raw.pl < 0 ? '#ff3d71' : f.raw.pl > 40 ? '#ffcc02' : 'var(--text-secondary)' },
                { label: 'P/VP', value: f.raw.pvp !== null && f.raw.pvp !== undefined ? f.raw.pvp.toFixed(2) : '--', color: f.raw.pvp < 0 ? '#ff3d71' : f.raw.pvp < 0.3 ? '#ffcc02' : 'var(--text-secondary)' },
                { label: 'DY', value: f.raw.dy !== null && f.raw.dy !== undefined ? `${f.raw.dy.toFixed(1)}%` : '--', color: 'var(--text-secondary)' },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Red flags */}
            {f.flags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {f.flags.map((flag, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, lineHeight: 1.5,
                    padding: '4px 6px', borderRadius: 5,
                    background: flag.severity === 'danger' ? 'rgba(255,61,113,0.1)' : 'rgba(255,204,2,0.08)',
                  }}>
                    <span style={{ flexShrink: 0 }}>{flag.icon}</span>
                    <span style={{ color: flag.severity === 'danger' ? '#ff7096' : '#ffd740' }}>
                      <strong>{flag.label}:</strong> {flag.detail.split(' — ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* "Don't buy" warning when fundamentally broken */}
            {isDanger && (
              <div style={{
                marginTop: 2, padding: '6px 10px', borderRadius: 6,
                background: 'rgba(255,61,113,0.12)', border: '1px solid rgba(255,61,113,0.3)',
                fontSize: 11, color: '#ff7096', lineHeight: 1.5,
              }}>
                ⚠️ <strong>Atenção:</strong> Não adianta comprar barato se a empresa está com problemas sérios. O preço pode continuar caindo por razões fundamentais.
              </div>
            )}
          </div>
        );
      })()}

      {/* Action button */}
      <button
        id={`add-radar-${result.ticker}`}
        onClick={() => onAdd(result)}
        disabled={alreadyAdded}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 0', borderRadius: 8, border: 'none', cursor: alreadyAdded ? 'default' : 'pointer',
          background: alreadyAdded ? 'var(--bg-input)' : `linear-gradient(135deg, ${tier.color}22, ${tier.color}44)`,
          color: alreadyAdded ? 'var(--text-muted)' : tier.color,
          fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
          transition: 'all 0.2s',
          borderWidth: 1, borderStyle: 'solid',
          borderColor: alreadyAdded ? 'var(--border)' : tier.border,
        }}
      >
        {alreadyAdded ? (
          <><BarChart2 size={15} /> Monitorando</>
        ) : (
          <><Plus size={15} /> Adicionar ao portfólio</>
        )}
      </button>
    </div>
  );
}

function buildExplanation(result) {
  const { indicators, signal } = result;
  const parts = [];

  if (indicators?.rsi < 35) parts.push(`RSI sobrevendido em ${indicators.rsi}`);
  if (indicators?.macd?.bullishCross) parts.push('MACD acabou de cruzar para positivo');
  else if (indicators?.macd?.isPositive) parts.push('MACD positivo');
  if (indicators?.bb?.nearLower) parts.push('preço na Banda Bollinger inferior (possível reversão)');
  if (indicators?.stoch?.k < 25) parts.push(`Estocástico sobrevendido (${indicators.stoch.k?.toFixed(0)})`);
  if (indicators?.volume?.aboveAvg) parts.push('volume confirmando o movimento');

  if (parts.length === 0) return 'Múltiplos indicadores convergindo para oportunidade de compra.';
  return parts.join(', ') + '. Alvo: swing trade de ~1 mês.';
}

// Scanning progress component
function ScanProgress({ current, total, currentTicker }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        border: '2px solid var(--accent)',
        animation: 'pulse 1.5s ease infinite',
      }}>
        <Radar size={36} color="var(--accent-bright)" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Varrendo o mercado...</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Analisando {SCAN_UNIVERSE.length} ações da B3 · calculando indicadores · rodando backtest histórico...
      </p>

      <div style={{
        background: 'var(--border)', height: 6, borderRadius: 100,
        overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, var(--accent), var(--accent-bright))',
          borderRadius: 100,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{current}/{total} analisadas</span>
        {currentTicker && <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-bright)' }}>
          → {currentTicker}
        </span>}
        <span>{pct}%</span>
      </div>
    </div>
  );
}

export default function RadarPage({ onAddToPortfolio }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, ticker: '' });
  const [results, setResults] = useState([]);
  const [scannedAt, setScannedAt] = useState(null);
  const [portfolio, setPortfolioList] = useState(() => getPortfolio().map(s => s.ticker));

  const handleScan = useCallback(async () => {
    setScanning(true);
    setResults([]);
    setProgress({ current: 0, total: SCAN_UNIVERSE.length, ticker: '' });

    const allResults = [];

    await scanAll((result, index, total) => {
      allResults.push(result);
      setProgress({ current: index, total, ticker: result.ticker });
      // Update results progressively so user sees cards appearing
      setResults([...allResults].filter(r => !r.error && r.opportunityScore > 0));
    }, 600);

    setResults(allResults.filter(r => !r.error && r.opportunityScore > 0));
    setScannedAt(new Date());
    setScanning(false);
  }, []);

  const handleAdd = async (result) => {
    try {
      await onAddToPortfolio(result.ticker, result.name);
      setPortfolioList(getPortfolio().map(s => s.ticker));
    } catch (e) {
      // already added — just ignore
      setPortfolioList(getPortfolio().map(s => s.ticker));
    }
  };

  const top = getTopOpportunities(results, 20);
  const sortedAll = [...results].sort((a, b) => b.opportunityScore - a.opportunityScore);
  const topResults = top;

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">📡 Radar de Oportunidades</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Varre {SCAN_UNIVERSE.length} ações da B3 e encontra as melhores oportunidades para lucrar em ~1 mês
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {scannedAt && !scanning && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {scannedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            id="btn-scan"
            className="btn btn-primary"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning
              ? <><RefreshCw size={14} className="pulse" /> Varrendo...</>
              : <><Radar size={14} /> {results.length > 0 ? 'Varrer novamente' : 'Iniciar varredura'}</>
            }
          </button>
        </div>
      </div>

      {/* Initial state */}
      {!scanning && results.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: 24,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(92,107,192,0.2) 0%, transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--accent)',
          }}>
            <Radar size={44} color="var(--accent-bright)" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Encontre as melhores oportunidades agora
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 480, lineHeight: 1.6 }}>
              O Radar analisa automaticamente as principais ações da B3 usando{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>RSI, MACD, Bollinger Bands e Estocástico</strong>{' '}
              para encontrar as melhores entradas para swing trade de ~1 mês.
            </p>
          </div>

          {/* What the radar does */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            maxWidth: 600, width: '100%',
          }}>
            {[
              { icon: '🔍', title: 'Varre 40 ações', desc: 'Ibovespa + dividendos' },
              { icon: '📊', title: 'Score 0-100', desc: '5 indicadores técnicos' },
              { icon: '🕐', title: 'Backtest incluso', desc: 'Valida se funcionou no passado' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <button id="start-scan" className="btn btn-primary" onClick={handleScan} style={{ fontSize: 15, padding: '12px 28px' }}>
            <Zap size={16} /> Encontrar melhores ações agora
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ⏱ Leva ~30 segundos para analisar todas as ações
          </p>
        </div>
      )}

      {/* Scanning progress */}
      {scanning && (
        <>
          <ScanProgress
            current={progress.current}
            total={progress.total}
            currentTicker={progress.ticker}
          />
          {/* Show cards as they come in */}
          {topResults.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Resultados parciais ({topResults.length} oportunidades encontradas até agora)...
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {topResults.map(r => (
                  <OpportunityCard
                    key={r.ticker}
                    result={r}
                    onAdd={handleAdd}
                    alreadyAdded={portfolio.includes(r.ticker)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {!scanning && results.length > 0 && (
        <div>
          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
          }}>
            {[
              { label: '🔥 Excelentes', count: results.filter(r => r.opportunityScore >= 70).length, color: 'var(--green)' },
              { label: '⚡ Boas', count: results.filter(r => r.opportunityScore >= 50 && r.opportunityScore < 70).length, color: 'var(--yellow)' },
              { label: '👀 Moderadas', count: results.filter(r => r.opportunityScore >= 30 && r.opportunityScore < 50).length, color: 'var(--blue)' },
              { label: '📊 Analisadas', count: results.length, color: 'var(--text-secondary)' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 13, color: item.color, fontWeight: 600 }}>{item.count}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Top picks header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
            paddingBottom: 16, borderBottom: '1px solid var(--border)',
          }}>
            <Zap size={18} color="var(--yellow)" />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Melhores oportunidades para comprar agora</h2>
            <span style={{
              marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>Ordenado por score de oportunidade</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {sortedAll
              .sort((a, b) => b.opportunityScore - a.opportunityScore)
              .map(r => (
                <OpportunityCard
                  key={r.ticker}
                  result={r}
                  onAdd={handleAdd}
                  alreadyAdded={portfolio.includes(r.ticker)}
                />
              ))
            }
          </div>

          {sortedAll.length === 0 && (
            <div className="alert alert-warning" style={{ maxWidth: 500, margin: '0 auto' }}>
              ⚠️ Nenhuma oportunidade de compra clara encontrada agora. O mercado pode estar em tendência de alta (sobrecomprado). Tente novamente em alguns dias.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
