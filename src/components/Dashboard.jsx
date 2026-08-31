import StockCard from './StockCard.jsx';
import { Plus, TrendingUp } from 'lucide-react';

export default function Dashboard({ portfolio, stockData, loading, onSelectStock, onRemoveStock, onRefreshStock, onAddStock }) {

  const signalCounts = Object.values(stockData).reduce((acc, d) => {
    if (d?.signal?.signal) {
      acc[d.signal.signal] = (acc[d.signal.signal] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div>
      {/* Page header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {portfolio.length} ações monitoradas • B3
          </p>
        </div>

        {portfolio.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {signalCounts.buy > 0 && (
              <div className="badge badge-buy">
                🟢 {signalCounts.buy} compra{signalCounts.buy > 1 ? 's' : ''}
              </div>
            )}
            {signalCounts.sell > 0 && (
              <div className="badge badge-sell">
                🔴 {signalCounts.sell} venda{signalCounts.sell > 1 ? 's' : ''}
              </div>
            )}
            {(signalCounts.watch_buy || 0) + (signalCounts.watch_sell || 0) > 0 && (
              <div className="badge badge-watch">
                👀 {(signalCounts.watch_buy || 0) + (signalCounts.watch_sell || 0)} observando
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {portfolio.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <TrendingUp size={28} />
          </div>
          <div className="empty-title">Nenhuma ação monitorada</div>
          <div className="empty-desc">
            Adicione ações da B3 para começar a monitorar sinais de compra e venda em tempo real.
          </div>
          <button id="empty-add-stock" className="btn btn-primary" onClick={onAddStock}>
            <Plus size={16} /> Adicionar primeira ação
          </button>
        </div>
      )}

      {/* Stock grid */}
      {portfolio.length > 0 && (
        <div className="stocks-grid">
          {portfolio.map(stock => (
            <StockCard
              key={stock.ticker}
              stock={stock}
              data={stockData[stock.ticker] || null}
              loading={loading[stock.ticker] || false}
              onSelect={onSelectStock}
              onRemove={onRemoveStock}
              onRefresh={onRefreshStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
