import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Settings, FlaskConical, Radar, RefreshCw, Plus, AlertTriangle, X } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import BacktestPanel from './components/BacktestPanel.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import RadarPage from './components/RadarPage.jsx';
import AddStockModal from './components/AddStockModal.jsx';
import { getPortfolio, addStock, removeStock, recordSignal, getLastSignalTime } from './store/portfolioStore.js';
import { fetchQuote, fetchHistory, hasBrapiToken, getErrorMessage } from './services/brapiService.js';
import { analyzeFundamentals } from './services/fundamentalService.js';
import { sendBuyAlert, sendSellAlert, isWhatsAppConfigured } from './services/whatsappService.js';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [portfolio, setPortfolio] = useState([]);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showTokenBanner, setShowTokenBanner] = useState(!hasBrapiToken());

  useEffect(() => {
    getPortfolio().then(saved => {
      setPortfolio(saved);
      if (saved.length > 0) refreshAll(saved);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (portfolio.length > 0) refreshAll(portfolio);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [portfolio]);

  const fetchStockData = useCallback(async (ticker) => {
    setLoading(prev => ({ ...prev, [ticker]: true }));
    try {
      const [quote, history] = await Promise.all([
        fetchQuote(ticker),
        fetchHistory(ticker, '3mo'),
      ]);
      
      const stockInfo = (await getPortfolio()).find(s => s.ticker === ticker);
      const fundamentals = analyzeFundamentals(quote);
      
      const currentPrice = quote?.regularMarketPrice;
      const price3mo = history && history.length > 0 ? history[0].close : null;
      const price1mo = history && history.length > 20 ? history[history.length - 21].close : null;
      
      const data = { quote, history, currentPrice, price1mo, price3mo, fundamentals, updatedAt: Date.now() };
      setStockData(prev => ({ ...prev, [ticker]: data }));
      
      await checkAndSendAlert(ticker, currentPrice, stockInfo);
    } catch (err) {
      const friendly = getErrorMessage(err.message);
      setStockData(prev => ({ ...prev, [ticker]: { error: friendly } }));
      if (err.message === 'TOKEN_REQUIRED') setShowTokenBanner(true);
    } finally {
      setLoading(prev => ({ ...prev, [ticker]: false }));
    }
  }, []);

  const checkAndSendAlert = async (ticker, currentPrice, stockInfo) => {
    if (!stockInfo || !currentPrice) return;
    
    const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours cooldown per signal
    const now = Date.now();
    
    // Check Buy Target
    if (stockInfo.buyTarget && currentPrice <= stockInfo.buyTarget) {
      const last = await getLastSignalTime(ticker, 'buy_target');
      if (!last || now - last > COOLDOWN) {
        await recordSignal(ticker, 'buy_target', currentPrice);
        await sendBuyAlert(ticker, stockInfo.buyTarget, currentPrice);
      }
    } 
    
    // Check Sell Target
    if (stockInfo.sellTarget && currentPrice >= stockInfo.sellTarget) {
      const last = await getLastSignalTime(ticker, 'sell_target');
      if (!last || now - last > COOLDOWN) {
        await recordSignal(ticker, 'sell_target', currentPrice);
        await sendSellAlert(ticker, stockInfo.sellTarget, currentPrice);
      }
    }
  };

  const refreshAll = async (stocks = portfolio) => {
    setRefreshing(true);
    for (const stock of stocks) await fetchStockData(stock.ticker);
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  const handleAddStock = async (ticker, name, buyTarget, sellTarget) => {
    try {
      await addStock(ticker, name, buyTarget, sellTarget);
      const updated = await getPortfolio();
      setPortfolio(updated);
      setShowAddModal(false);
      await fetchStockData(ticker);
    } catch (err) {
      throw err;
    }
  };

  const handleRemoveStock = async (ticker) => {
    await removeStock(ticker);
    const updated = await getPortfolio();
    setPortfolio(updated);
    setStockData(prev => { const n = { ...prev }; delete n[ticker]; return n; });
    if (selectedTicker === ticker) setSelectedTicker(null);
  };

  const handleSelectStock = (ticker) => {
    setSelectedTicker(ticker);
    setPage('backtest');
  };

  const handlePageChange = (p) => {
    setPage(p);
    // Re-check token when leaving settings
    if (p !== 'settings') setShowTokenBanner(!hasBrapiToken());
  };

  const navItems = [
    { id: 'dashboard', label: 'Portfólio', icon: <LayoutDashboard size={15} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={15} /> },
  ];

  // Buy signal count across portfolio
  const buySignals = Object.values(stockData).filter(d => d?.signal?.signal === 'buy').length;

  return (
    <div className="app">
      {/* Token missing banner */}
      {showTokenBanner && (
        <div style={{
          background: 'linear-gradient(90deg, #7c3f00, #5c2d00)',
          borderBottom: '1px solid rgba(255,204,2,0.3)',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13,
        }}>
          <AlertTriangle size={15} color="var(--yellow)" style={{ flexShrink: 0 }} />
          <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Token brapi.dev não configurado.</span>
          <span style={{ color: 'rgba(255,204,2,0.7)' }}>Algumas ações retornam erro 401. Configure gratuitamente em</span>
          <button
            onClick={() => { handlePageChange('settings'); }}
            style={{
              background: 'rgba(255,204,2,0.15)', border: '1px solid rgba(255,204,2,0.4)',
              color: 'var(--yellow)', borderRadius: 6, padding: '2px 10px',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            }}
          >⚙️ Configurações →</button>
          <button
            onClick={() => setShowTokenBanner(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,204,2,0.5)', cursor: 'pointer', padding: 4 }}
          ><X size={14} /></button>
        </div>
      )}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="logo-icon">📡</div>
            <div>
              <div className="brand-name">StockRadar</div>
              <div className="brand-sub">B3 · Swing Trade 1M</div>
            </div>
          </div>

          <div className="navbar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-btn ${page === item.id ? 'active' : ''}`}
                onClick={() => handlePageChange(item.id)}
              >
                {item.icon} {item.label}
                {item.id === 'dashboard' && buySignals > 0 && (
                  <span style={{
                    background: 'var(--green)', color: '#000',
                    borderRadius: 100, fontSize: 10, fontWeight: 700,
                    padding: '1px 5px', marginLeft: 2,
                  }}>{buySignals}</span>
                )}
              </button>
            ))}
          </div>

          <div className="navbar-actions">
            {lastRefresh && page === 'dashboard' && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {page === 'dashboard' && (
              <>
                <button id="btn-refresh" className="btn btn-ghost btn-sm" onClick={() => refreshAll()} disabled={refreshing}>
                  <RefreshCw size={14} className={refreshing ? 'pulse' : ''} />
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button id="btn-add-stock" className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                  <Plus size={14} /> Adicionar Ação
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {page === 'dashboard' && (
          <Dashboard
            portfolio={portfolio}
            stockData={stockData}
            loading={loading}
            onSelectStock={handleSelectStock}
            onRemoveStock={handleRemoveStock}
            onRefreshStock={fetchStockData}
            onAddStock={() => setShowAddModal(true)}
          />
        )}

        {page === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {showAddModal && (
        <AddStockModal onAdd={handleAddStock} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
