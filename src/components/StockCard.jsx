import { Trash2, RefreshCw, TrendingUp, TrendingDown, Target } from 'lucide-react';

function IndicatorChip({ label, value, color }) {
  return (
    <div className="ind-chip" style={{ background: 'var(--bg-input)' }}>
      <span className="ind-label" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function StockCard({ stock, data, loading, onSelect, onRemove, onRefresh }) {
  const isLoading = loading;
  const hasError = data?.error;
  const { quote, fundamentals, currentPrice, price1mo, price3mo } = data || {};

  const name = quote?.longName || quote?.shortName || stock.name || stock.ticker;

  const formatPrice = (v) => v ? `R$ ${v.toFixed(2)}` : '--';
  const calcChange = (curr, past) => curr && past ? ((curr - past) / past) * 100 : null;
  const change1mo = calcChange(currentPrice, price1mo);
  const change3mo = calcChange(currentPrice, price3mo);

  const getChangeColor = (v) => v >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div
      id={`stock-card-${stock.ticker}`}
      className="stock-card"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="stock-card-header">
        <div>
          <div className="stock-ticker">{stock.ticker}</div>
          <div className="stock-name">{name}</div>
        </div>
        <div className="stock-price" style={{ textAlign: 'right' }}>
          {isLoading ? (
            <div className="spinner" style={{ width: 16, height: 16 }} />
          ) : (
            <>
              <div className="price" style={{ fontSize: 20 }}>{formatPrice(currentPrice)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PREÇO ATUAL</div>
            </>
          )}
        </div>
      </div>

      {/* Error state */}
      {hasError && (
        <div className="alert alert-error" style={{ marginBottom: 12, fontSize: 12 }}>
          ⚠️ {data.error}
        </div>
      )}

      {/* Historical Variations */}
      {!isLoading && !hasError && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, background: 'var(--bg-input)', padding: 12, borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>1 MÊS ATRÁS</div>
            <div style={{ fontSize: 13 }}>{formatPrice(price1mo)}</div>
            {change1mo !== null && (
              <div style={{ fontSize: 11, color: getChangeColor(change1mo), display: 'flex', alignItems: 'center', gap: 2 }}>
                {change1mo >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {change1mo >= 0 ? '+' : ''}{change1mo.toFixed(2)}%
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>3 MESES ATRÁS</div>
            <div style={{ fontSize: 13 }}>{formatPrice(price3mo)}</div>
            {change3mo !== null && (
              <div style={{ fontSize: 11, color: getChangeColor(change3mo), display: 'flex', alignItems: 'center', gap: 2 }}>
                {change3mo >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {change3mo >= 0 ? '+' : ''}{change3mo.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Targets */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> SEUS ALVOS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '8px 12px', border: '1px solid var(--green-border)', background: 'rgba(0,230,118,0.05)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>🟢 COMPRAR EM</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(stock.buyTarget)}</div>
            {stock.buyTarget && currentPrice && currentPrice <= stock.buyTarget && (
              <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 4, fontWeight: 700 }}>ALVO ATINGIDO!</div>
            )}
          </div>
          <div style={{ padding: '8px 12px', border: '1px solid var(--red-border)', background: 'rgba(255,61,113,0.05)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>🔴 VENDER EM</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(stock.sellTarget)}</div>
            {stock.sellTarget && currentPrice && currentPrice >= stock.sellTarget && (
              <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 4, fontWeight: 700 }}>ALVO ATINGIDO!</div>
            )}
          </div>
        </div>
      </div>

      {/* Fundamentals chips */}
      {!isLoading && fundamentals && (
        <div className="stock-indicators">
          <IndicatorChip
            label="ROE"
            value={fundamentals.raw.roe != null ? `${fundamentals.raw.roe.toFixed(1)}%` : '--'}
            color={fundamentals.raw.roe < 0 ? 'var(--red)' : 'var(--text-primary)'}
          />
          <IndicatorChip
            label="P/L"
            value={fundamentals.raw.pl != null ? fundamentals.raw.pl.toFixed(1) : '--'}
            color={fundamentals.raw.pl < 0 ? 'var(--red)' : 'var(--text-primary)'}
          />
          <IndicatorChip
            label="P/VP"
            value={fundamentals.raw.pvp != null ? fundamentals.raw.pvp.toFixed(2) : '--'}
            color={fundamentals.raw.pvp < 0 ? 'var(--red)' : 'var(--text-primary)'}
          />
        </div>
      )}

      {/* Footer */}
      <div className="stock-card-footer" style={{ marginTop: 16 }}>
        <div className="last-updated">
          {data?.updatedAt
            ? `Atualizado ${new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Não atualizado'
          }
        </div>
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button
            id={`refresh-${stock.ticker}`}
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => onRefresh(stock.ticker)}
            title="Atualizar"
          >
            <RefreshCw size={13} />
          </button>
          <button
            id={`remove-${stock.ticker}`}
            className="btn btn-danger btn-sm btn-icon"
            onClick={() => onRemove(stock.ticker)}
            title="Remover"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
