import { useState } from 'react';
import { X, Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { fetchQuote, fetchHistory } from '../services/brapiService.js';
import { analyzeFundamentals } from '../services/fundamentalService.js';

export default function AddStockModal({ onAdd, onClose }) {
  const [ticker, setTicker] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  
  const [buyTarget, setBuyTarget] = useState('');
  const [sellTarget, setSellTarget] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;

    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const [quote, history] = await Promise.all([
        fetchQuote(t),
        fetchHistory(t, '3mo'),
      ]);
      
      const currentPrice = quote?.regularMarketPrice;
      const price3mo = history && history.length > 0 ? history[0].close : null;
      const price1mo = history && history.length > 20 ? history[history.length - 21].close : null;
      const fundamentals = analyzeFundamentals(quote);
      
      setPreview({
        ticker: t,
        name: quote?.longName || quote?.shortName || t,
        currentPrice,
        price1mo,
        price3mo,
        fundamentals,
      });
      
      // Auto-suggest targets
      if (currentPrice) {
        setBuyTarget((currentPrice * 0.95).toFixed(2));
        setSellTarget((currentPrice * 1.05).toFixed(2));
      }
    } catch (err) {
      setError('Ação não encontrada ou erro na API');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAdd(preview.ticker, preview.name, buyTarget, sellTarget);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">Adicionar Ação ao Monitor</h2>
          <button id="close-add-modal" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!preview ? (
          <form onSubmit={handleSearch}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Qual ação você quer monitorar?</label>
              <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="ticker-input"
                    className="form-input"
                    style={{ paddingLeft: 38, textTransform: 'uppercase', width: '100%' }}
                    placeholder="Ex: PETR4"
                    value={ticker}
                    onChange={e => setTicker(e.target.value.toUpperCase())}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !ticker}>
                  {loading ? 'Buscando...' : 'Pesquisar'}
                </button>
              </div>
              {error && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠️ {error}</div>}
            </div>
          </form>
        ) : (
          <div>
            {/* Raio-X */}
            <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{preview.ticker}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{preview.name}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PREÇO ATUAL</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>R$ {preview.currentPrice?.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>1 MÊS ATRÁS</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>R$ {preview.price1mo?.toFixed(2)}</div>
                  <Variation current={preview.currentPrice} past={preview.price1mo} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>3 MESES ATRÁS</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>R$ {preview.price3mo?.toFixed(2)}</div>
                  <Variation current={preview.currentPrice} past={preview.price3mo} />
                </div>
              </div>

              {/* Fundamentos */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: preview.fundamentals.ratingColor, marginBottom: 8, textTransform: 'uppercase' }}>
                  {preview.fundamentals.ratingLabel}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ROE:</span> {preview.fundamentals.raw.roe?.toFixed(1) || '--'}%</div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>P/L:</span> {preview.fundamentals.raw.pl?.toFixed(1) || '--'}</div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>DÍVIDA (P/VP):</span> {preview.fundamentals.raw.pvp?.toFixed(2) || '--'}</div>
                </div>
              </div>
            </div>

            {/* Inputs de Alvo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--green)' }}>🟢 Preço Alvo (Compra)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>R$</span>
                  <input
                    type="number" step="0.01"
                    className="form-input" style={{ paddingLeft: 35, borderColor: 'var(--green-border)' }}
                    value={buyTarget} onChange={e => setBuyTarget(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Avisa se cair abaixo disso</div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--red)' }}>🔴 Preço Alvo (Venda)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>R$</span>
                  <input
                    type="number" step="0.01"
                    className="form-input" style={{ paddingLeft: 35, borderColor: 'var(--red-border)' }}
                    value={sellTarget} onChange={e => setSellTarget(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Avisa se subir acima disso</div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setPreview(null)}>Voltar</button>
              <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                {loading ? 'Salvando...' : 'Adicionar ao Monitor'}
              </button>
            </div>
            {error && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠️ {error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Variation({ current, past }) {
  if (!current || !past) return null;
  const pct = ((current - past) / past) * 100;
  const isPos = pct >= 0;
  return (
    <div style={{ fontSize: 11, color: isPos ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
      {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {isPos ? '+' : ''}{pct.toFixed(2)}%
    </div>
  );
}
