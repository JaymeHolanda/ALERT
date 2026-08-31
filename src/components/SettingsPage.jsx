import { useState } from 'react';
import { setToken, hasBrapiToken } from '../services/brapiService.js';
import { MessageCircle, Save, Info, Key, ExternalLink, CheckCircle, Database } from 'lucide-react';
import { sendWhatsApp } from '../services/whatsappService.js';

export default function SettingsPage() {
  // brapi token
  const [brapiToken, setBrapiToken] = useState(localStorage.getItem('brapi_token') || '');
  const [tokenSaved, setTokenSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');

  const handleSaveToken = () => {
    setToken(brapiToken);
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 3000);
  };

  const handleTestWhatsApp = async () => {
    setTestStatus('loading');
    const result = await sendWhatsApp('✅ *Monitor Pessoal* — Teste de conexão!\n\nSeus alertas CallMeBot estão configurados corretamente com a chave hardcoded. 📈');
    setTestStatus(result.success ? 'sent' : 'error');
    setTimeout(() => setTestStatus(''), 5000);
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <div className="dashboard-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Configurações</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Integrações ativas do Monitor Pessoal
          </p>
        </div>
      </div>

      {/* ── brapi.dev Token ─────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">
          <Key size={18} color="var(--yellow)" />
          Token brapi.dev
          {hasBrapiToken() && (
            <span style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--green)', fontWeight: 500,
            }}>
              <CheckCircle size={13} /> Configurado
            </span>
          )}
        </div>

        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13 }}>
            <strong>Por que preciso de um token?</strong>{' '}
            A brapi.dev exige cadastro gratuito para acessar a cotação das ações.
          </div>
        </div>

        <div className="settings-card">
          <div className="form-group">
            <label className="form-label">Token da brapi.dev</label>
            <input
              id="brapi-token"
              className="form-input"
              placeholder="Cole seu token aqui..."
              value={brapiToken}
              onChange={e => setBrapiToken(e.target.value)}
              type="password"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>

          {tokenSaved && (
            <div className="alert alert-success">
              ✅ Token salvo!
            </div>
          )}

          <button id="save-token" className="btn btn-primary" onClick={handleSaveToken} disabled={!brapiToken.trim()}>
            <Save size={14} /> Salvar token
          </button>
        </div>
      </div>

      {/* ── Integrações Fixas ─────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">
          <Database size={18} color="var(--blue)" /> Integrações em Nuvem
        </div>
        <div className="settings-card" style={{ gap: 16 }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ background: 'rgba(255,160,0,0.1)', padding: 8, borderRadius: 8 }}>
              <Database size={20} color="#FFA000" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Firebase Firestore</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Conectado ao projeto <strong>b3procurador</strong>.
                Seu portfólio está sendo salvo na nuvem.
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ background: 'rgba(0,230,118,0.1)', padding: 8, borderRadius: 8 }}>
              <MessageCircle size={20} color="#00e676" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>CallMeBot WhatsApp</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Configurado permanentemente para o número final 1996.
              </div>
              
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={handleTestWhatsApp} disabled={testStatus === 'loading'}>
                  {testStatus === 'loading' ? 'Enviando...' : 'Testar Mensagem'}
                </button>
                {testStatus === 'sent' && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--green)' }}>✅ Enviada!</span>}
                {testStatus === 'error' && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--red)' }}>❌ Erro no envio</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
