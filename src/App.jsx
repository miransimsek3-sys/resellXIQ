import { useState, useMemo, useEffect, useRef } from 'react';

const SUPABASE_URL = 'https://bwjehefepaqfkplwboud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3amVoZWZlcGFxZmtwbHdib3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzUzODUsImV4cCI6MjA5NTM1MTM4NX0.LvCu_gLq-hez326Z3OMw4q6w95DnHtmAWv3l7hoAwgk';
const STRIPE = { pro: 'https://buy.stripe.com/test_8x214ne9VfJydzU85laIM00', business: 'https://buy.stripe.com/test_00w7sL6HtcxmbrM4T9aIM01', elite: 'https://buy.stripe.com/test_fZu4gz0j568Y7bw0CTaIM02' };
const PLAN_LIMITS = {
  starter: { chat: 1, analyzer: 0, vendors: 0, scanPerDay: 2, label: 'Starter', color: '#666' },
  pro:     { chat: 999, analyzer: 5, vendors: 2, scanPerDay: 20, label: 'Pro', color: '#4caf50' },
  business:{ chat: 999, analyzer: 999, vendors: 99, scanPerDay: 999, label: 'Business', color: '#888' },
  elite:   { chat: 999, analyzer: 999, vendors: 99, scanPerDay: 999, label: 'Elite', color: '#fff' },
};

async function sbAuth(action, email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${action}`, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.error || data.error_description) throw new Error(data.error_description || data.error?.message || 'Fehler');
  return data;
}
async function sbRequest(path, options = {}, token = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...options.headers }, ...options });
  const text = await res.text();
  try { return text ? JSON.parse(text) : []; } catch { return []; }
}
async function callClaude(messages, system = '') {
  const res = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, system }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const extractText = (content) => {
    if (!Array.isArray(content)) return '';
    return content.map(block => {
      if (block.type === 'text') return block.text;
      if (block.type === 'tool_result' && Array.isArray(block.content)) return extractText(block.content);
      return '';
    }).join('');
  };
  return extractText(data.content) || '';
}
async function callClaudeWithImage(imageData, prompt) {
  const res = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } }, { type: 'text', text: prompt }] }] }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.content?.map(i => i.type === 'text' ? i.text : '').join('') || '';
}

const T = {
  de: { heroTitle: 'Dein nächstes Inserat', heroHighlight: 'in 10 Sekunden.', heroDesc: 'Mach ein Foto – ResellXIQ schreibt Titel, Beschreibung, schlägt Preis vor und erstellt Hashtags.', ctaPrimary: 'Jetzt starten →', ctaSecondary: 'Wie es funktioniert', stats: ['10 Sek pro Inserat', '240+ Vendors', 'Kostenlos starten'], nav: { home: 'Start', scan: 'Foto Scan', analyzer: 'Analyzer', trends: 'Trends', chat: 'KI Chat', calc: 'Rechner', inventory: 'Lager', vendors: 'Vendors', dashboard: 'Dashboard' }, login: 'Einloggen', register: 'Registrieren', logout: 'Abmelden', email: 'E-Mail', password: 'Passwort', loginBtn: 'Einloggen →', registerBtn: 'Registrieren →' },
  en: { heroTitle: 'Your next listing', heroHighlight: 'in 10 seconds.', heroDesc: 'Take a photo — AI writes title, description, suggests price and creates hashtags.', ctaPrimary: 'Get started →', ctaSecondary: 'How it works', stats: ['10 sec per listing', '240+ Vendors', 'Start for free'], nav: { home: 'Home', scan: 'Photo Scan', analyzer: 'Analyzer', trends: 'Trends', chat: 'AI Chat', calc: 'Calculator', inventory: 'Inventory', vendors: 'Vendors', dashboard: 'Dashboard' }, login: 'Sign In', register: 'Register', logout: 'Sign Out', email: 'Email', password: 'Password', loginBtn: 'Sign In →', registerBtn: 'Register →' },
};

const ALL_VENDORS = [
  { name: 'Vinted DE', url: 'https://vinted.de', desc: 'Größter Second-Hand Marktplatz in Deutschland', tier: 'pro' },
  { name: 'eBay Kleinanzeigen', url: 'https://kleinanzeigen.de', desc: 'Lokaler Verkauf in Deutschland', tier: 'pro' },
  { name: 'Depop', url: 'https://depop.com', desc: 'Streetwear & Vintage – Gen Z fokussiert', tier: 'business' },
  { name: 'Grailed', url: 'https://grailed.com', desc: 'Designer & Streetwear für Männer', tier: 'business' },
  { name: 'Vinted FR', url: 'https://vinted.fr', desc: 'Vinted Frankreich – oft günstigere Preise', tier: 'business' },
  { name: 'StockX', url: 'https://stockx.com', desc: 'Sneaker Authentifikation & Preisindex', tier: 'business' },
  { name: 'GOAT', url: 'https://goat.com', desc: 'Premium Sneaker Marktplatz', tier: 'business' },
  { name: 'Vestiaire Collective', url: 'https://vestiairecollective.com', desc: 'Authentifizierter Luxus Second-Hand', tier: 'business' },
  { name: 'Rebelle', url: 'https://rebelle.com', desc: 'Authentifizierte Designer Mode', tier: 'business' },
  { name: 'Momox Fashion', url: 'https://momoxfashion.com', desc: 'Verkauf an Momox – fester Preis', tier: 'business' },
  { name: 'Sellpy', url: 'https://sellpy.de', desc: 'Komplett-Service Reselling', tier: 'business' },
  { name: 'Wholesale7', url: 'https://wholesale7.net', desc: 'Großhandel China – Kleidung', tier: 'business' },
  { name: 'Alibaba', url: 'https://alibaba.com', desc: 'Größter B2B Marktplatz', tier: 'business' },
  { name: '⭐ Elite Supplier Network', url: '#', desc: 'Exklusives Netzwerk von verifizierten Premium-Lieferanten', tier: 'elite' },
  { name: '⭐ Insider Wholesale Deals', url: '#', desc: 'Wöchentliche Deals exklusiv für Elite-Mitglieder', tier: 'elite' },
];

// Bildsuche läuft sicher über euer Backend – kein API Key im Frontend!
async function fetchGoogleImage(query) {
  try {
    const res = await fetch(`/api/image?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.images?.[0]?.url || null;
  } catch {
    return null;
  }
}

async function fetchLiveTrends() {
  const monat = new Date().toLocaleDateString('de-DE', {month:'long', year:'numeric'});
  const prompt = `Du bist ein Reselling-Experte fuer Vinted. Heute ist ${monat}. Erstelle eine Top-10 Liste der meistgefragten Artikel auf Vinted Deutschland passend zur aktuellen Jahreszeit. Antworte AUSSCHLIESSLICH mit einem JSON-Array ohne Markdown oder Erklaerungen: [{"name":"...","brand":"...","hype_score":90,"avg_price_eur":60,"sell_speed":"sehr schnell","trend_reason":"...","tip":"...","trend":"steigend"}]`;

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      system: 'Antworte NUR mit einem validen JSON-Array. Kein anderer Text, keine Backticks, kein Markdown.'
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const rawText = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const m = rawText.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('Kein JSON. Antwort: ' + rawText.slice(0, 300));
  return JSON.parse(m[0]);
}

const AGB_TEXT = `ResellXIQ Nutzungsbedingungen

1. Nutzung: ResellXIQ ist ein KI-gestütztes Tool für Vinted-Reseller. Nur für legale Zwecke.

2. KI-Inhalte: Alle KI-generierten Preiseinschätzungen sind unverbindliche Empfehlungen ohne Gewähr.

3. Datenschutz: E-Mail wird bei Supabase (EU-Server, Frankfurt) gespeichert. Keine Datenweitergabe.

4. Lizenzen: Jeder Plan erfordert eine gültige Lizenz. Lizenzen sind nicht übertragbar.

5. Haftung: ResellXIQ haftet nicht für Verluste aus Reselling-Entscheidungen.

6. Änderungen: Wir können die AGB jederzeit anpassen.

Erstellt von Deniz Coban & Miran Simsek · Köln · miransimsek42@gmail.com`;

const ROOT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  * { font-stretch: normal !important; box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100vh; background: #050505; overflow-x: hidden; }
  body { font-family: 'Inter', sans-serif; color: #fff; }
  ::-webkit-scrollbar { width: 3px; background: #050505; }
  ::-webkit-scrollbar-thumb { background: #1a1a1a; }
  input, button, textarea { font-family: inherit; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 30px rgba(76,175,80,0.3); } 50% { box-shadow: 0 0 60px rgba(76,175,80,0.5); } }
  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
  .nav-item { transition: all 0.2s ease; }
  .nav-item:hover { background: #111 !important; border-color: #333 !important; color: #fff !important; }
  .nav-item.active { background: #4caf50 !important; color: #000 !important; border-color: #4caf50 !important; }
  .card-hover { transition: all 0.2s ease; }
  .card-hover:hover { border-color: #2a2a2a !important; transform: translateY(-1px); }
  input::placeholder { color: #333; }
  input:focus { border-color: #4caf50 !important; outline: none; }
  a { color: inherit; text-decoration: none; }
`;

function Modal({ children, onClose, maxWidth = 420 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)' }} onClick={e => e.target === e.currentTarget && onClose && onClose()}>
      <div className="scale-in" style={{ width: '100%', maxWidth, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function AgbModal({ onAccept }) {
  const [checked, setChecked] = useState(false);
  return (
    <Modal maxWidth={500}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, background: '#4caf50', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 13, color: '#000', fontWeight: 900, fontFamily: 'Syne, sans-serif' }}>X</span></div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Nutzungsbedingungen</h2>
        </div>
        <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: 10, padding: 16, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
          {AGB_TEXT.split('\n').map((line, i) => <p key={i} style={{ fontSize: 12, color: line.match(/^\d\./) ? '#fff' : '#888', lineHeight: 1.7, marginBottom: line === '' ? 8 : 4, fontWeight: line.match(/^\d\./) ? 600 : 400 }}>{line}</p>)}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#4caf50' }} />
          <span style={{ fontSize: 13, color: '#aaa' }}>Ich stimme den Nutzungsbedingungen zu</span>
        </label>
        <button onClick={onAccept} disabled={!checked} style={{ width: '100%', background: checked ? '#4caf50' : '#1a1a1a', color: checked ? '#000' : '#444', border: 'none', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 700, cursor: checked ? 'pointer' : 'default', fontFamily: 'Syne, sans-serif', transition: 'all 0.2s' }}>Weiter →</button>
      </div>
    </Modal>
  );
}

function VerifyModal({ onVerified, onBack }) {
  return (
    <Modal maxWidth={400}>
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 12 }}>E-Mail bestätigen</h2>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>Wir haben dir einen Bestätigungslink geschickt. Bitte bestätige deine E-Mail und logge dich dann ein.</p>
        <button onClick={onVerified} style={{ width: '100%', background: '#4caf50', color: '#000', border: 'none', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', marginBottom: 10 }}>Ich habe bestätigt → Zum Login</button>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#444', fontSize: 12, cursor: 'pointer' }}>← Zurück</button>
      </div>
    </Modal>
  );
}

function LoginModal({ lang, onLogin, onClose }) {
  const t = T[lang];
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  const handle = async () => {
    if (!email || !pw) return;
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const data = await sbAuth('token?grant_type=password', email, pw);
        if (!data.access_token) throw new Error('Login fehlgeschlagen');
        const profiles = await sbRequest(`profiles?id=eq.${data.user.id}&select=plan`, {}, data.access_token).catch(() => []);
        const plan = profiles?.[0]?.plan || 'starter';
        onLogin({ token: data.access_token, email: data.user.email, id: data.user.id, plan });
      } else {
        await sbAuth('signup', email, pw);
        setShowVerify(true);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  if (showVerify) return <VerifyModal onVerified={() => { setShowVerify(false); setMode('login'); }} onBack={() => setShowVerify(false)} />;
  const iStyle = { width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fff', outline: 'none' };

  return (
    <Modal onClose={onClose} maxWidth={380}>
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, background: '#4caf50', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 13, color: '#000', fontWeight: 900, fontFamily: 'Syne, sans-serif' }}>X</span></div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>ResellXIQ</span>
        </div>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', gap: 3, background: '#080808', borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {['login','signup'].map(m => <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, background: mode===m?'#4caf50':'transparent', color: mode===m?'#000':'#444', border: 'none', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{m==='login'?t.login:t.register}</button>)}
        </div>
        {mode==='signup' && <div style={{ background: '#080808', border: '1px solid #1a3a1a', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: '#4caf50', lineHeight: 1.6 }}>Nach der Registrierung bekommst du einen Bestätigungslink per E-Mail. Erst danach kannst du dich einloggen.</div>}
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.email}</p>
          <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} style={iStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.password}</p>
          <input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==='Enter'&&handle()} style={iStyle} />
        </div>
        {error && <div style={{ background: '#0a0000', border: '1px solid #2a0000', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#ff6b6b' }}>{error}</div>}
        <button onClick={handle} disabled={loading||!email||!pw} style={{ width: '100%', background: '#4caf50', color: '#000', border: 'none', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: email&&pw?1:0.4, marginBottom: 10 }}>{loading?'...':mode==='login'?t.loginBtn:t.registerBtn}</button>
        {onClose && <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: '#444', border: '1px solid #1a1a1a', borderRadius: 10, padding: '11px', fontSize: 12, cursor: 'pointer' }}>Als Gast weiterschauen</button>}
      </div>
    </Modal>
  );
}

function LicenseModal({ user, onActivated, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activate = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const licenses = await sbRequest(`licenses?code=eq.${code.trim().toUpperCase()}&used=eq.false&select=*`, {}, user.token);
      if (!licenses||licenses.length===0) throw new Error('Ungültiger oder bereits verwendeter Lizenzcode.');
      const lic = licenses[0];
      await sbRequest(`licenses?id=eq.${lic.id}`, { method: 'PATCH', body: JSON.stringify({ used: true, used_by: user.id, used_at: new Date().toISOString() }) }, user.token);
      await sbRequest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ plan: lic.plan }) }, user.token).catch(() => {});
      setSuccess(`✅ ${lic.plan.toUpperCase()} Plan aktiviert!`);
      setTimeout(() => onActivated(lic.plan), 1500);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} maxWidth={380}>
      <div style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>🔑 Lizenz aktivieren</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>Gib deinen Lizenzcode ein den du nach dem Kauf per E-Mail erhalten hast.</p>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter'&&activate()} placeholder="RXIQ-XXXX-XXXX" style={{ width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 10, padding: '13px 14px', fontSize: 14, color: '#fff', outline: 'none', marginBottom: 12, letterSpacing: '0.1em', fontFamily: 'Syne, sans-serif' }} />
        {error && <div style={{ background: '#0a0000', border: '1px solid #2a0000', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#ff6b6b' }}>{error}</div>}
        {success && <div style={{ background: '#0a1a0a', border: '1px solid #1a4a1a', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#4caf50' }}>{success}</div>}
        <button onClick={activate} disabled={loading||!code.trim()} style={{ width: '100%', background: '#4caf50', color: '#000', border: 'none', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: code.trim()?1:0.4, marginBottom: 10 }}>{loading?'...':'Aktivieren'}</button>
        <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: '#444', border: '1px solid #1a1a1a', borderRadius: 10, padding: '11px', fontSize: 12, cursor: 'pointer' }}>Schließen</button>
      </div>
    </Modal>
  );
}

function UpgradeModal({ requiredPlan, onClose, onLicense }) {
  const plans = { pro: { price: '9,99€', stripe: STRIPE.pro }, business: { price: '19,99€', stripe: STRIPE.business }, elite: { price: '32,99€', stripe: STRIPE.elite } };
  const p = plans[requiredPlan] || plans.pro;
  return (
    <Modal onClose={onClose} maxWidth={380}>
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>Upgrade erforderlich</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>Du brauchst mindestens <strong style={{ color: '#fff' }}>{requiredPlan?.toUpperCase()}</strong> für dieses Feature.</p>
        <a href={p.stripe} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#4caf50', color: '#000', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 10 }}>{requiredPlan?.toUpperCase()} kaufen – {p.price}/Monat →</a>
        <button onClick={onLicense} style={{ width: '100%', background: 'transparent', color: '#4caf50', border: '1px solid #1a3a1a', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>🔑 Lizenzcode eingeben</button>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#444', fontSize: 12, cursor: 'pointer' }}>Schließen</button>
      </div>
    </Modal>
  );
}

function PricingGrid({ onLogin }) {
  const [selected, setSelected] = useState(null);
  const plans = [
    { id: 'starter', name: 'STARTER', price: '0€', period: 'Kostenlos', color: '#444', border: '#1a1a1a', glow: 'rgba(255,255,255,0.05)', features: ['2 Foto Scans pro Tag','1 KI Chat Nachricht','Trends ansehen','Kein Vendor Zugang','Kein Analyzer'], btnBg: 'transparent', btnColor: '#fff', btnBorder: '1px solid #222', btnLabel: 'Kostenlos starten', link: null },
    { id: 'pro', name: 'PRO', price: '9,99€', period: 'pro Monat', color: '#4caf50', border: '#4caf50', glow: 'rgba(76,175,80,0.25)', bg: 'linear-gradient(135deg,#0a1a0a,#050505)', features: ['20 Foto Scans pro Tag','Unlimitierter KI Chat','5 Analyzer Checks','2 Vendors freigeschaltet','Lager & Dashboard'], btnBg: '#4caf50', btnColor: '#000', btnBorder: 'none', btnLabel: 'Pro kaufen →', link: STRIPE.pro },
    { id: 'business', name: 'BUSINESS', price: '19,99€', period: 'pro Monat', color: '#888', border: '#222', glow: 'rgba(255,255,255,0.05)', features: ['Unlimitierte Foto Scans','Unlimitierter Analyzer','Alle Vendors (13+)','Preis-Alerts','Priorität Support'], btnBg: '#fff', btnColor: '#000', btnBorder: 'none', btnLabel: 'Business kaufen →', link: STRIPE.business },
    { id: 'elite', name: 'ELITE', price: '32,99€', period: 'pro Monat', color: '#fff', border: '#fff', glow: 'rgba(255,255,255,0.18)', bg: 'linear-gradient(135deg,#0d0d0d,#050505)', badge: '⭐ BELIEBT', features: ['Alles aus Business','Persönliche Marktanalysen','Elite Vendor Bereich','Support via WhatsApp','Monatlicher Trend Report'], btnBg: 'linear-gradient(135deg,#333,#111)', btnColor: '#fff', btnBorder: '1px solid #444', btnLabel: 'Elite kaufen →', link: STRIPE.elite },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
      {plans.map(plan => {
        const isSel = selected===plan.id;
        return (
          <div key={plan.id} onClick={() => setSelected(plan.id)} style={{ background: plan.bg||'#0a0a0a', border: isSel?`2px solid ${plan.color}`:`1px solid ${plan.border}`, borderRadius: 16, padding: '28px 22px', position: 'relative', cursor: 'pointer', transition: 'all 0.25s ease', boxShadow: isSel?`0 0 40px ${plan.glow}`:'none', transform: isSel?'translateY(-4px)':'none' }}>
            {plan.badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: 20, padding: '3px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: 9, color: '#000', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}>{plan.badge}</span></div>}
            {isSel && <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, background: plan.color==='#444'?'#fff':plan.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span></div>}
            <p style={{ fontSize: 10, color: plan.color, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>{plan.name}</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', marginBottom: 4 }}>{plan.price}</p>
            <p style={{ fontSize: 11, color: '#555', marginBottom: 24 }}>{plan.period}</p>
            {plan.features.map(f => <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}><span style={{ color: plan.color, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span><span style={{ fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>{f}</span></div>)}
            {plan.link
              ? <a href={plan.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'block', width: '100%', background: plan.btnBg, color: plan.btnColor, border: plan.btnBorder, borderRadius: 10, padding: '13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', marginTop: 20, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>{plan.btnLabel}</a>
              : <button onClick={e => { e.stopPropagation(); onLogin(); }} style={{ width: '100%', background: plan.btnBg, color: plan.btnColor, border: plan.btnBorder, borderRadius: 10, padding: '13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', marginTop: 20 }}>{plan.btnLabel}</button>
            }
          </div>
        );
      })}
    </div>
  );
}

function LandingPage({ lang, onLogin, onImpressum }) {
  const t = T[lang];
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0a1a0a 0%,#050505 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle,rgba(76,175,80,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div className="fade-in" style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, padding: '6px 16px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, background: '#4caf50', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#4caf50', letterSpacing: '0.08em', fontWeight: 600 }}>Foto hochladen · Fertig. So einfach.</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem,7vw,4.5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28, fontFamily: 'Syne, sans-serif', color: '#4caf50' }}>{t.heroTitle}<br />{t.heroHighlight}</h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#888', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 44px' }}>{t.heroDesc}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <button onClick={onLogin} style={{ background: '#4caf50', color: '#000', border: 'none', borderRadius: 12, padding: '16px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', animation: 'glow 2s ease-in-out infinite' }}>{t.ctaPrimary}</button>
          <button onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} style={{ background: 'transparent', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#4caf50'} onMouseLeave={e=>e.currentTarget.style.borderColor='#2a2a2a'}>{t.ctaSecondary}</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {t.stats.map((s,i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 6, height: 6, background: '#4caf50', borderRadius: '50%' }} /><span style={{ fontSize: 12, color: '#666', letterSpacing: '0.05em' }}>{s}</span></div>)}
        </div>
      </div>
      <div id="how" style={{ maxWidth: 720, width: '100%', marginTop: 100, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 10, color: '#4caf50', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>WIE ES FUNKTIONIERT</p>
          <h2 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Mehr verkaufen. Weniger Zeit verschwenden.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 60 }}>
          {[{icon:'📸',step:'01',title:'Foto machen',desc:'Einfach den Artikel fotografieren – kein Setup, kein Aufwand.'},{icon:'🤖',step:'02',title:'KI analysiert',desc:'Unsere KI erkennt das Produkt, schätzt Marktpreis und checkt den aktuellen Trend.'},{icon:'✨',step:'03',title:'Anzeige fertig',desc:'Titel, Beschreibung und Hashtags – fertig zum Einfügen auf Vinted.'}].map((f,i) => (
            <div key={i} style={{ background: '#0a0a0a', border: '1px solid #111', borderRadius: 14, padding: '24px 20px', textAlign: 'left', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, color: '#1a1a1a', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{f.step}</span>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 14 }}>{f.icon}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>{f.title}</p>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(76,175,80,0.04)', border: '1px solid #1a3a1a', borderRadius: 14, padding: '24px', marginBottom: 80, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#4caf50', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>🤝 Gemeinsam stärker</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>Wir arbeiten mit hunderten Resellern zusammen.</p>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>Von Köln bis Berlin – unsere Community teilt Trends, Tipps und Strategien. Du bist nicht allein.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
            {[['500+','Aktive Reseller'],['10K+','Inserate erstellt'],['4.9★','Bewertung']].map(([val,label]) => (
              <div key={label} style={{ textAlign: 'center' }}><p style={{ fontSize: 22, fontWeight: 800, color: '#4caf50', fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>{val}</p><p style={{ fontSize: 11, color: '#444' }}>{label}</p></div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 10, color: '#4caf50', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>PRICING</p>
          <h2 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Starte kostenlos. Wachse schneller.</h2>
          <p style={{ fontSize: 15, color: '#666' }}>Kein Vertrag. Jederzeit kündbar.</p>
        </div>
        <PricingGrid onLogin={onLogin} />
      </div>
      <div style={{ maxWidth: 720, width: '100%', marginTop: 40, borderTop: '1px solid #111', paddingTop: 30, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#333', marginBottom: 8 }}>© 2025 ResellXIQ · Deniz Coban & Miran Simsek · Köln</p>
        <span style={{ fontSize: 11, color: '#4caf50', cursor: 'pointer', textDecoration: 'underline' }} onClick={onImpressum}>Impressum</span>
      </div>
    </div>
  );
}

function PhotoScan({ lang, onAddInventory, plan }) {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  const handleUpload = e => { const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>{setImage(ev.target.result);setImageData(ev.target.result.split(',')[1]);setResult(null);setError('');};r.readAsDataURL(file); };
  const analyze = async () => {
    if(!imageData) return;
    setLoading(true); setResult(null); setError('');
    try {
      const text = await callClaudeWithImage(imageData, `Du bist Vinted Reselling Experte. Analysiere das Foto und antworte NUR als JSON:\n{"product_name":"Name","brand":"Marke","category":"Kategorie","condition":"Sehr gut","estimated_price_eur":45,"price_range":"X-Y€","hype_score":75,"sell_speed":"sehr schnell","trend":"steigend","listing_title":"Titel max 60 Zeichen","listing_description":"3 Sätze auf ${lang==='de'?'Deutsch':'Englisch'} verkaufsstark","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","tips":["Tipp1","Tipp2"],"buy_recommendation":"ja","reason":"Begründung"}`);
      const m = text.match(/\{[\s\S]*\}/);
      if(m) setResult(JSON.parse(m[0])); else setError('Analyse fehlgeschlagen.');
    } catch(e) { setError('Error: '+e.message); }
    setLoading(false);
  };
  const listing = result?`${result.listing_title}\n\n${result.listing_description}\n\n${result.hashtags}`:'';
  const handleAdd = () => { if(!result) return; onAddInventory({name:result.product_name,brand:result.brand,avg_price_eur:result.estimated_price_eur,img:image},'0','1',String(result.estimated_price_eur)); setAdded(true); setTimeout(()=>setAdded(false),2000); };

  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>📸 Foto Scan</h2>
        <p style={{fontSize:13,color:'#666',marginBottom:8}}>Foto hochladen → KI erkennt Produkt & schreibt Anzeige</p>
        <span style={{fontSize:10,color:'#4caf50',background:'rgba(76,175,80,0.1)',border:'1px solid #1a3a1a',borderRadius:10,padding:'3px 8px',fontWeight:700}}>{PLAN_LIMITS[plan]?.scanPerDay===999?'∞':PLAN_LIMITS[plan]?.scanPerDay} Scans/Tag</span>
      </div>
      <label style={{display:'block',cursor:'pointer',marginBottom:16}}>
        <input type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}} />
        <div style={{background:'#0a0a0a',border:'1px dashed '+(image?'#333':'#222'),borderRadius:14,overflow:'hidden',minHeight:220,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
          {image?(<><img src={image} alt="upload" style={{width:'100%',maxHeight:320,objectFit:'contain'}}/><div style={{position:'absolute',bottom:10,right:10,background:'rgba(0,0,0,0.75)',borderRadius:8,padding:'5px 10px'}}><span style={{fontSize:11,color:'#aaa'}}>Tippen zum Ändern</span></div></>):(<div style={{textAlign:'center',padding:40}}><div style={{fontSize:44,marginBottom:14}}>📸</div><p style={{fontSize:15,color:'#888',fontFamily:'Syne, sans-serif',fontWeight:700,marginBottom:4}}>Foto hochladen</p><p style={{fontSize:12,color:'#333'}}>Kamera oder Galerie</p></div>)}
        </div>
      </label>
      {image&&!result&&<button onClick={analyze} disabled={loading} style={{width:'100%',background:'#4caf50',color:'#000',border:'none',borderRadius:12,padding:'15px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',marginBottom:16}}>{loading?'KI analysiert...':'🔍 Produkt analysieren'}</button>}
      {loading&&<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'40px',textAlign:'center',marginBottom:16}}><div style={{width:32,height:32,border:'2px solid #1a1a1a',borderTop:'2px solid #4caf50',borderRadius:'50%',margin:'0 auto 16px',animation:'spin 0.9s linear infinite'}}/><p style={{fontSize:14,color:'#fff',fontFamily:'Syne, sans-serif',fontWeight:700}}>KI erkennt dein Produkt...</p></div>}
      {error&&<div style={{background:'#0a0000',border:'1px solid #2a0000',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#ff6b6b',marginBottom:12}}>{error}</div>}
      {result&&!loading&&(
        <div className="fade-in">
          <div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'20px',marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:12}}>
              <div style={{flex:1,minWidth:0}}><p style={{fontSize:11,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{result.brand}</p><p style={{fontSize:20,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif'}}>{result.product_name}</p><p style={{fontSize:12,color:'#666',marginTop:4}}>{result.category} · {result.condition}</p></div>
              <div style={{background:result.buy_recommendation==='ja'?'#4caf50':'#1a0000',borderRadius:8,padding:'5px 12px',flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:result.buy_recommendation==='ja'?'#000':'#ff6b6b',fontFamily:'Syne, sans-serif'}}>{result.buy_recommendation==='ja'?'✓ KAUFEN':'✗ SKIP'}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[{label:'PREIS',value:result.price_range},{label:'HYPE',value:result.hype_score+'/100'},{label:'TREND',value:result.trend}].map(s=><div key={s.label} style={{background:'#050505',borderRadius:10,padding:'12px 10px',textAlign:'center'}}><p style={{fontSize:9,color:'#333',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{s.label}</p><p style={{fontSize:13,fontWeight:700,color:'#fff',fontFamily:'Syne, sans-serif'}}>{s.value}</p></div>)}
            </div>
            {result.reason&&<div style={{marginTop:14,padding:'11px 13px',background:'#050505',borderRadius:8}}><p style={{fontSize:12,color:'#777',lineHeight:1.6}}>{result.reason}</p></div>}
          </div>
          <div style={{background:'rgba(76,175,80,0.04)',border:'1px solid #1a3a1a',borderRadius:14,padding:'20px',marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <p style={{fontSize:11,color:'#4caf50',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600}}>✨ Fertige Anzeige</p>
              <button onClick={()=>{navigator.clipboard?.writeText(listing);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:copied?'#0f2a0f':'transparent',color:'#4caf50',border:'1px solid '+(copied?'#1a4a1a':'#1a3a1a'),borderRadius:6,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer'}}>{copied?'✓ Kopiert':'📋 Kopieren'}</button>
            </div>
            <div style={{background:'#050a05',borderRadius:10,padding:'14px'}}><p style={{fontSize:14,fontWeight:700,fontFamily:'Syne, sans-serif',marginBottom:8}}>{result.listing_title}</p><p style={{fontSize:13,color:'#88aa88',lineHeight:1.6,marginBottom:10}}>{result.listing_description}</p><p style={{fontSize:12,color:'#558855'}}>{result.hashtags}</p></div>
          </div>
          {result.tips?.length>0&&<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'18px',marginBottom:14}}><p style={{fontSize:11,color:'#666',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600,marginBottom:12}}>💡 Tips</p>{result.tips.map((tip,i)=><div key={i} style={{display:'flex',gap:12,marginBottom:8}}><span style={{fontSize:11,color:'#333',minWidth:20,fontWeight:700}}>0{i+1}</span><span style={{fontSize:13,color:'#888',lineHeight:1.6}}>{tip}</span></div>)}</div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <button onClick={handleAdd} style={{background:added?'#0f2a0f':'#4caf50',color:added?'#4caf50':'#000',border:added?'1px solid #1a4a1a':'none',borderRadius:10,padding:'13px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>{added?'✓ Im Lager':'📦 Ins Lager'}</button>
            <a href={`https://www.vinted.de/catalog?search_text=${encodeURIComponent((result.brand||'')+' '+(result.product_name||''))}`} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',color:'#fff',border:'1px solid #1a1a1a',borderRadius:10,padding:'13px',fontSize:12,fontWeight:700}}>🛍️ Vinted</a>
          </div>
          <button onClick={()=>{setImage(null);setImageData(null);setResult(null);}} style={{width:'100%',background:'transparent',color:'#444',border:'none',padding:'14px',fontSize:12,cursor:'pointer'}}>↺ Neues Foto scannen</button>
        </div>
      )}
    </div>
  );
}

function ListingAnalyzer({ plan, onUpgrade }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [used, setUsed] = useState(0);
  const limit = PLAN_LIMITS[plan]?.analyzer||0;

  if(limit===0) return <div className="fade-in" style={{textAlign:'center',padding:'60px 20px'}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><h2 style={{fontSize:24,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',marginBottom:12}}>Pro Feature</h2><p style={{fontSize:14,color:'#666',marginBottom:24}}>Listing Analyzer ist ab Pro verfügbar (5 Checks).</p><button onClick={()=>onUpgrade('pro')} style={{background:'#4caf50',color:'#000',border:'none',borderRadius:10,padding:'13px 24px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>Auf Pro upgraden</button></div>;

  const analyze = async () => {
    if(!url.trim()) return;
    if(limit!==999&&used>=limit){onUpgrade('business');return;}
    setLoading(true); setResult(null); setError('');
    try {
      const text = await callClaude([{role:'user',content:`Analysiere diese Vinted-Anzeige: ${url}\nAntworte NUR als JSON:\n{"score":75,"verdict":"Gut","photo_score":27,"photo_max":30,"title_score":12,"title_max":20,"desc_score":18,"desc_max":25,"details_score":8,"details_max":15,"price_score":10,"price_max":10,"helps":["P1","P2","P3"],"hurts":["P1"],"improvements":["I1","I2"]}`}],'Antworte NUR als valides JSON.');
      const m=text.match(/\{[\s\S]*\}/);
      if(m){setResult(JSON.parse(m[0]));setUsed(c=>c+1);}else setError('Analyse fehlgeschlagen.');
    } catch(e){setError('Error: '+e.message);}
    setLoading(false);
  };

  const CS = ({score}) => {
    const r=70,c=2*Math.PI*r,col=score>=70?'#4caf50':score>=40?'#ff8c00':'#ff3b3b';
    return <div style={{position:'relative',width:180,height:180,margin:'0 auto'}}><svg width="180" height="180" style={{transform:'rotate(-90deg)'}}><circle cx="90" cy="90" r={r} fill="none" stroke="#1a1a1a" strokeWidth="8"/><circle cx="90" cy="90" r={r} fill="none" stroke={col} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c-(score/100)*c} strokeLinecap="round" style={{transition:'stroke-dashoffset 1s ease'}}/></svg><div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:44,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',lineHeight:1}}>{score}</span><span style={{fontSize:10,color:'#444',letterSpacing:'0.15em',marginTop:6}}>SCORE</span></div></div>;
  };

  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}>
        <div style={{display:'inline-block',padding:'4px 10px',background:'rgba(76,175,80,0.1)',border:'1px solid #1a3a1a',borderRadius:6,marginBottom:10}}><span style={{fontSize:9,color:'#4caf50',letterSpacing:'0.12em',fontWeight:700}}>PREMIUM · {limit===999?'∞':`${used}/${limit}`} CHECKS</span></div>
        <h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>Listing Analyzer</h2>
        <p style={{fontSize:13,color:'#666'}}>Vinted Link einfügen → KI bewertet deine Anzeige</p>
      </div>
      {limit!==999&&used>=limit?<div style={{background:'#0a0a0a',border:'1px solid #1a3a1a',borderRadius:14,padding:'40px 20px',textAlign:'center'}}><p style={{fontSize:14,color:'#fff',fontFamily:'Syne, sans-serif',fontWeight:700,marginBottom:8}}>Limit erreicht</p><button onClick={()=>onUpgrade('business')} style={{background:'#4caf50',color:'#000',border:'none',borderRadius:10,padding:'11px 20px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',marginTop:12}}>Business upgraden für ∞ Checks</button></div>:(
        <>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&analyze()} placeholder="https://www.vinted.de/items/..." style={{flex:1,background:'#0a0a0a',border:'1px solid #1a1a1a',borderRadius:10,padding:'13px 14px',fontSize:13,color:'#fff',outline:'none'}}/>
            <button onClick={analyze} disabled={loading||!url.trim()} style={{background:'#4caf50',color:'#000',border:'none',borderRadius:10,padding:'13px 22px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',whiteSpace:'nowrap',opacity:url.trim()?1:0.4}}>{loading?'...':'Analysieren'}</button>
          </div>
          {loading&&<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'40px',textAlign:'center'}}><div style={{width:30,height:30,border:'2px solid #1a1a1a',borderTop:'2px solid #4caf50',borderRadius:'50%',margin:'0 auto',animation:'spin 0.9s linear infinite'}}/></div>}
          {error&&<div style={{background:'#0a0000',border:'1px solid #2a0000',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#ff6b6b'}}>{error}</div>}
          {result&&!loading&&<div className="fade-in">
            <div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'32px 20px',textAlign:'center',marginBottom:14}}><CS score={result.score}/><h3 style={{marginTop:20,fontSize:22,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif'}}>{result.verdict==='Gut'?'Gutes Verkaufspotenzial':result.verdict==='OK'?'OK Potenzial':'Niedriges Potenzial'}</h3></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {[{label:'FOTOS',val:result.photo_score,max:result.photo_max},{label:'TITEL',val:result.title_score,max:result.title_max},{label:'BESCHREIBUNG',val:result.desc_score,max:result.desc_max},{label:'DETAILS',val:result.details_score,max:result.details_max},{label:'PRICE',val:result.price_score,max:result.price_max}].map(s=><div key={s.label} style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:10,padding:'14px'}}><p style={{fontSize:9,color:'#444',letterSpacing:'0.1em',fontWeight:600,marginBottom:6}}>{s.label}</p><p style={{fontSize:18,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif'}}>{s.val}<span style={{color:'#333',fontSize:13}}>/{s.max}</span></p></div>)}
            </div>
            {[{title:'Was hilft',items:result.helps,color:'#4caf50'},{title:'Was schadet',items:result.hurts,color:'#ff3b3b'},{title:'Verbesserungen',items:result.improvements,color:'#666'}].map(section=>section.items?.length>0&&<div key={section.title} style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'18px',marginBottom:10}}><p style={{fontSize:13,fontFamily:'Syne, sans-serif',fontWeight:700,marginBottom:12}}>{section.title}</p>{section.items.map((h,i)=><div key={i} style={{display:'flex',gap:10,marginBottom:8}}><span style={{width:6,height:6,background:section.color,borderRadius:'50%',marginTop:8,flexShrink:0}}/><span style={{fontSize:13,color:'#aaa',lineHeight:1.5}}>{h}</span></div>)}</div>)}
          </div>}
          {!result&&!loading&&!error&&<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'50px 20px',textAlign:'center'}}><p style={{fontSize:32,marginBottom:10}}>🔗</p><p style={{fontSize:13,color:'#444'}}>Vinted Link einfügen</p></div>}
        </>
      )}
    </div>
  );
}

function VendorDirectory({ plan, onUpgrade }) {
  const [search, setSearch] = useState('');
  const tierOrder = {starter:0,pro:1,business:2,elite:3};
  const planTier = tierOrder[plan]||0;
  const limit = PLAN_LIMITS[plan]?.vendors||0;

  if(limit===0) return <div className="fade-in" style={{textAlign:'center',padding:'60px 20px'}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><h2 style={{fontSize:24,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',marginBottom:12}}>Pro Feature</h2><p style={{fontSize:14,color:'#666',marginBottom:24}}>Vendor Directory ist ab Pro verfügbar.</p><button onClick={()=>onUpgrade('pro')} style={{background:'#4caf50',color:'#000',border:'none',borderRadius:10,padding:'13px 24px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>Auf Pro upgraden</button></div>;

  const normalVendors = ALL_VENDORS.filter(v=>v.tier!=='elite'&&tierOrder[v.tier]<=planTier);
  const eliteVendors = ALL_VENDORS.filter(v=>v.tier==='elite');
  const display = limit===99?normalVendors.filter(v=>!search.trim()||v.name.toLowerCase().includes(search.toLowerCase())):normalVendors.slice(0,limit);

  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}>
        <div style={{display:'inline-block',padding:'4px 10px',background:'rgba(76,175,80,0.1)',border:'1px solid #1a3a1a',borderRadius:6,marginBottom:10}}><span style={{fontSize:9,color:'#4caf50',letterSpacing:'0.12em',fontWeight:700}}>{limit===99?normalVendors.length:limit} VENDORS FREIGESCHALTET</span></div>
        <h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>Vendor Directory</h2>
        <p style={{fontSize:13,color:'#666'}}>Kuratierte Liste von Marktplätzen für Reseller.</p>
      </div>
      {limit===99&&<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Vendor suchen..." style={{width:'100%',background:'#0a0a0a',border:'1px solid #1a1a1a',borderRadius:10,padding:'12px 14px',fontSize:13,color:'#fff',outline:'none',marginBottom:16}}/>}
      {display.map((v,i)=><a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="card-hover" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,background:'#0a0a0a',border:'1px solid #111',borderRadius:12,padding:'16px',marginBottom:8,textDecoration:'none'}}><div style={{flex:1,minWidth:0}}><p style={{fontSize:14,fontWeight:700,color:'#fff',fontFamily:'Syne, sans-serif',marginBottom:4}}>{v.name}</p><p style={{fontSize:12,color:'#666'}}>{v.desc}</p></div><span style={{fontSize:14,color:'#444'}}>↗</span></a>)}
      {plan==='elite'&&<div style={{marginTop:24}}><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{flex:1,height:1,background:'#1a1a1a'}}/><span style={{fontSize:10,color:'#fff',letterSpacing:'0.15em',fontWeight:700,whiteSpace:'nowrap'}}>⭐ ELITE BEREICH</span><div style={{flex:1,height:1,background:'#1a1a1a'}}/></div>{eliteVendors.map((v,i)=><div key={i} style={{background:'linear-gradient(135deg,#0d0d0d,#050505)',border:'1px solid #333',borderRadius:12,padding:'16px',marginBottom:8}}><p style={{fontSize:14,fontWeight:700,color:'#fff',fontFamily:'Syne, sans-serif',marginBottom:4}}>{v.name}</p><p style={{fontSize:12,color:'#666'}}>{v.desc}</p></div>)}</div>}
      {plan!=='elite'&&<div style={{marginTop:24,background:'rgba(255,255,255,0.02)',border:'1px dashed #222',borderRadius:12,padding:'20px',textAlign:'center'}}><p style={{fontSize:13,color:'#444',marginBottom:12}}>⭐ Elite Vendor Bereich – exklusiv für Elite-Mitglieder</p><button onClick={()=>onUpgrade('elite')} style={{background:'transparent',color:'#fff',border:'1px solid #333',borderRadius:8,padding:'8px 16px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>Elite werden → 32,99€/Monat</button></div>}
    </div>
  );
}

function Trends({ lang, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [imgLoadingSet, setImgLoadingSet] = useState(new Set());

  const load = async () => {
    setLoading(true); setError('');
    try {
      const trends = await fetchLiveTrends();
      // Bilder parallel laden
      const withImgs = await Promise.all(
        trends.map(async (item) => {
          const img = await fetchGoogleImage(`${item.brand} ${item.name} fashion product`);
          return { ...item, img };
        })
      );
      setItems(withImgs);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Trends konnten nicht geladen werden: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const trendColor = t => t === 'steigend' ? '#4caf50' : t === 'fallend' ? '#ff6b6b' : '#888';
  const trendIcon  = t => t === 'steigend' ? '↑' : t === 'fallend' ? '↓' : '→';

  if (loading) return (
    <div className="fade-in">
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>🔥 Trends</h2>
        <p style={{fontSize:13,color:'#666'}}>KI analysiert aktuelle Vinted-Trends...</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {[...Array(6)].map((_,i) => (
          <div key={i} style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:12,height:86,overflow:'hidden',display:'flex',opacity:1-i*0.12}}>
            <div style={{width:86,background:'#111',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(76,175,80,0.07),transparent)',animation:'shimmer 1.4s infinite'}}/>
            </div>
            <div style={{flex:1,padding:'14px',display:'flex',flexDirection:'column',gap:8,justifyContent:'center'}}>
              <div style={{height:8,background:'#111',borderRadius:4,width:'40%',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(76,175,80,0.07),transparent)',animation:'shimmer 1.4s infinite'}}/>
              </div>
              <div style={{height:12,background:'#111',borderRadius:4,width:'60%',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(76,175,80,0.07),transparent)',animation:'shimmer 1.4s infinite'}}/>
              </div>
              <div style={{height:8,background:'#111',borderRadius:4,width:'80%',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(76,175,80,0.07),transparent)',animation:'shimmer 1.4s infinite'}}/>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
        <div>
          <h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>🔥 Trends</h2>
          <p style={{fontSize:13,color:'#666'}}>Live KI-Analyse · Top Artikel auf Vinted aktuell</p>
          {lastUpdated && <p style={{fontSize:10,color:'#333',marginTop:4}}>Aktualisiert: {lastUpdated.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</p>}
        </div>
        <button onClick={load} style={{background:'transparent',border:'1px solid #1a3a1a',borderRadius:8,padding:'8px 14px',color:'#4caf50',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',whiteSpace:'nowrap',flexShrink:0}}>↻ Neu laden</button>
      </div>
      {error && <div style={{background:'#0a0000',border:'1px solid #2a0000',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#ff6b6b',marginBottom:16}}>{error}</div>}
      {items.map((item, i) => (
        <div key={i} onClick={() => onSelect(item)} className="card-hover"
          style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:12,marginBottom:8,overflow:'hidden',cursor:'pointer',display:'flex'}}>
          <div style={{width:86,height:86,flexShrink:0,background:'#111',position:'relative',overflow:'hidden'}}>
            {item.img ? (
              <img src={item.img} alt={item.name}
                style={{width:'100%',height:'100%',objectFit:'cover',display:imgLoadingSet.has(i)?'none':'block'}}
                onLoad={() => setImgLoadingSet(s => { const n=new Set(s); n.delete(i); return n; })}
                onError={e => { e.target.style.display='none'; }}
              />
            ) : (
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#0d0d0d'}}>
                <span style={{fontSize:28}}>👟</span>
              </div>
            )}
            <div style={{position:'absolute',top:4,left:4,background:'rgba(0,0,0,0.75)',borderRadius:4,padding:'2px 6px'}}>
              <span style={{fontSize:9,color:'#4caf50',fontWeight:800,fontFamily:'Syne, sans-serif'}}>#{i+1}</span>
            </div>
          </div>
          <div style={{flex:1,padding:'12px 14px',minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5,gap:8}}>
              <div style={{minWidth:0}}>
                <p style={{fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:2}}>{item.brand}</p>
                <h3 style={{fontSize:15,fontWeight:700,color:'#fff',fontFamily:'Syne, sans-serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</h3>
              </div>
              <span style={{fontSize:11,color:trendColor(item.trend),fontWeight:700,flexShrink:0}}>{trendIcon(item.trend)}</span>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'#4caf50',fontWeight:700}}>{item.hype_score}/100</span>
              <span style={{fontSize:10,color:'#222'}}>·</span>
              <span style={{fontSize:11,color:'#aaa'}}>~{item.avg_price_eur}€</span>
              <span style={{fontSize:10,color:'#222'}}>·</span>
              <span style={{fontSize:10,color:'#666'}}>{item.sell_speed}</span>
            </div>
            <p style={{fontSize:11,color:'#444',marginTop:5,lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.trend_reason}</p>
          </div>
        </div>
      ))}
      {!loading && items.length === 0 && !error && (
        <div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'50px 20px',textAlign:'center'}}>
          <p style={{fontSize:13,color:'#444'}}>Keine Trends geladen</p>
          <button onClick={load} style={{marginTop:12,background:'#4caf50',color:'#000',border:'none',borderRadius:8,padding:'10px 20px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>Jetzt laden</button>
        </div>
      )}
    </div>
  );
}

function ItemModal({ item, onClose, onAdd }) {
  const [bp,setBp]=useState(''); const [sp,setSp]=useState(String(item.avg_price_eur)); const [qty,setQty]=useState('1'); const [added,setAdded]=useState(false);
  const profit=(parseFloat(sp)-parseFloat(bp))*parseInt(qty);
  const iStyle={width:'100%',background:'#080808',border:'1px solid #1a1a1a',borderRadius:8,padding:'11px 14px',fontSize:13,color:'#fff',outline:'none'};
  return (
    <Modal onClose={onClose}>
      <div style={{position:'relative',height:180,background:'#0a0a0a',overflow:'hidden'}}>
        {item.img
          ? <img src={item.img} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.5)'}} onError={e=>{e.target.style.display='none';}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,opacity:0.15}}>👕</div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,#0d0d0d,transparent)'}}/>
        <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.6)',border:'1px solid #2a2a2a',color:'#fff',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:18}}>×</button>
        <div style={{position:'absolute',bottom:16,left:20}}>
          <p style={{fontSize:11,color:'#777',textTransform:'uppercase',marginBottom:4}}>{item.brand}</p>
          <h2 style={{fontSize:22,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif'}}>{item.name}</h2>
        </div>
      </div>
      <div style={{padding:20}}>
        <div style={{background:'rgba(76,175,80,0.04)',border:'1px solid #1a3a1a',borderRadius:10,padding:'14px',marginBottom:16}}><p style={{fontSize:10,color:'#4caf50',textTransform:'uppercase',marginBottom:6}}>💡 Pro Tip</p><p style={{fontSize:13,color:'#88aa88',lineHeight:1.6}}>{item.tip}</p></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
          <div><p style={{fontSize:10,color:'#444',textTransform:'uppercase',marginBottom:5}}>Einkauf</p><input type="number" placeholder="0" value={bp} onChange={e=>setBp(e.target.value)} style={iStyle}/></div>
          <div><p style={{fontSize:10,color:'#444',textTransform:'uppercase',marginBottom:5}}>Verkauf</p><input type="number" value={sp} onChange={e=>setSp(e.target.value)} style={iStyle}/></div>
          <div><p style={{fontSize:10,color:'#444',textTransform:'uppercase',marginBottom:5}}>Anzahl</p><input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={iStyle}/></div>
        </div>
        {bp&&sp&&<div style={{background:profit>0?'rgba(76,175,80,0.06)':'rgba(255,59,59,0.06)',border:'1px solid '+(profit>0?'#1a3a1a':'#3a1a1a'),borderRadius:10,padding:'12px 14px',marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:11,color:'#666',textTransform:'uppercase'}}>Gewinn</span><span style={{fontSize:20,fontWeight:800,color:profit>0?'#4caf50':'#ff6b6b',fontFamily:'Syne, sans-serif'}}>{profit>=0?'+':''}{profit.toFixed(2)}€</span></div>}
        <button onClick={()=>{if(!bp)return;onAdd(item,bp,qty,sp);setAdded(true);setTimeout(()=>{setAdded(false);onClose();},1500);}} disabled={!bp} style={{width:'100%',background:added?'#0f2a0f':'#4caf50',color:added?'#4caf50':'#000',border:added?'1px solid #1a4a1a':'none',borderRadius:10,padding:'13px',fontSize:13,fontWeight:700,cursor:bp?'pointer':'default',fontFamily:'Syne, sans-serif',opacity:bp?1:0.4}}>{added?'✓ Hinzugefügt':'📦 Zum Lager hinzufügen'}</button>
      </div>
    </Modal>
  );
}

function AiChat({ lang, plan, onUpgrade }) {
  const [messages,setMessages]=useState([{role:'assistant',text:'Hey. Ich bin dein Vinted-KI-Assistent. Frag mich alles.'}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const [msgCount,setMsgCount]=useState(0);
  const limit=PLAN_LIMITS[plan]?.chat||1;
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  const send=async()=>{
    if(!input.trim()||loading) return;
    if(msgCount>=limit){onUpgrade('pro');return;}
    const msg=input.trim(); setInput('');
    setMessages(prev=>[...prev,{role:'user',text:msg}]);
    setLoading(true); setMsgCount(c=>c+1);
    try {
      const history=messages.slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.text}));
      const reply=await callClaude([...history,{role:'user',content:msg}],'Du bist ResellXIQ – KI-Assistent für Vinted-Reseller. Antworte auf Deutsch, direkt und konkret.');
      setMessages(prev=>[...prev,{role:'assistant',text:reply}]);
    } catch(e){setMessages(prev=>[...prev,{role:'assistant',text:'Error: '+e.message}]);}
    setLoading(false);
  };
  const atLimit=msgCount>=limit;
  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',height:'calc(100vh - 130px)'}}>
      <div style={{marginBottom:16}}><h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>💬 KI Chat</h2><span style={{fontSize:10,color:limit===999?'#4caf50':'#888',background:'rgba(76,175,80,0.1)',border:'1px solid #1a3a1a',borderRadius:10,padding:'3px 8px'}}>{limit===999?'∞ Nachrichten':`${msgCount}/${limit} Nachrichten`}</span></div>
      <div style={{flex:1,overflowY:'auto',marginBottom:12}}>
        {messages.map((m,i)=><div key={i} className="fade-in" style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:12}}>{m.role==='assistant'&&<div style={{width:28,height:28,background:'#4caf50',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',marginRight:8,flexShrink:0,alignSelf:'flex-end'}}><span style={{fontSize:13,color:'#000',fontWeight:900,fontFamily:'Syne, sans-serif'}}>X</span></div>}<div style={{maxWidth:'80%',background:m.role==='user'?'#4caf50':'#0d0d0d',border:m.role==='assistant'?'1px solid #1a1a1a':'none',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'11px 14px',fontSize:13,color:m.role==='user'?'#000':'#bbb',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{m.text}</div></div>)}
        {loading&&<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,background:'#4caf50',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:13,color:'#000',fontWeight:900,fontFamily:'Syne, sans-serif'}}>X</span></div><div style={{background:'#0d0d0d',border:'1px solid #1a1a1a',borderRadius:'14px 14px 14px 4px',padding:'11px 14px'}}><span style={{fontSize:12,color:'#444'}}>Schreibt...</span></div></div>}
        {atLimit&&<div style={{background:'#0a0a0a',border:'1px solid #1a3a1a',borderRadius:12,padding:'16px',textAlign:'center',marginTop:12}}><p style={{fontSize:13,color:'#fff',marginBottom:10}}>Limit erreicht – upgrade für mehr</p><button onClick={()=>onUpgrade('pro')} style={{background:'#4caf50',color:'#000',border:'none',borderRadius:8,padding:'8px 16px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>Auf Pro upgraden</button></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={atLimit?'Limit erreicht...':'Nachricht...'} disabled={atLimit} style={{flex:1,background:'#080808',border:'1px solid #1a1a1a',borderRadius:10,padding:'12px 14px',fontSize:13,color:'#fff',outline:'none',opacity:atLimit?0.5:1}}/>
        <button onClick={send} disabled={loading||!input.trim()||atLimit} style={{background:input.trim()&&!atLimit?'#4caf50':'#111',color:'#000',border:'none',borderRadius:10,padding:'12px 18px',fontSize:14,fontWeight:700,cursor:'pointer'}}>→</button>
      </div>
    </div>
  );
}

function Calculator({ onAdd }) {
  const [bp,setBp]=useState(''); const [sp,setSp]=useState(''); const [qty,setQty]=useState('1'); const [sh,setSh]=useState('');
  const [name,setName]=useState(''); const [brand,setBrand]=useState('');
  const [showAdd,setShowAdd]=useState(false); const [added,setAdded]=useState(false);
  const buy=parseFloat(bp)||0, sell=parseFloat(sp)||0, q=parseInt(qty)||1, ship=parseFloat(sh)||0;
  const perItem=sell-buy-ship, total=perItem*q, margin=buy>0?((perItem/buy)*100).toFixed(0):null;
  const pc=total>0?'#4caf50':total<0?'#ff6b6b':'#666';
  const iStyle={width:'100%',background:'#080808',border:'1px solid #1a1a1a',borderRadius:10,padding:'12px 14px',fontSize:13,color:'#fff',outline:'none'};
  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}><h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>💰 Gewinnrechner</h2><p style={{fontSize:13,color:'#666'}}>Berechne deinen Gewinn</p></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {[{label:'Einkaufspreis €',val:bp,set:setBp,ph:'25'},{label:'Verkaufspreis €',val:sp,set:setSp,ph:'65'},{label:'Anzahl',val:qty,set:setQty,ph:'1'},{label:'Versand €',val:sh,set:setSh,ph:'0'}].map(f=><div key={f.label}><p style={{margin:'0 0 6px',fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>{f.label}</p><input type="number" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} style={iStyle}/></div>)}
      </div>
      {buy>0&&sell>0?<>
        <div style={{background:total>0?'rgba(76,175,80,0.04)':'rgba(255,59,59,0.04)',border:'1px solid '+(total>0?'#1a3a1a':'#3a1a1a'),borderRadius:14,padding:'20px',marginBottom:12}}>
          {[{label:'Investiert',val:(buy*q).toFixed(2)+'€',color:'#666'},{label:'Gewinn/Stück',val:(perItem>=0?'+':'')+perItem.toFixed(2)+'€',color:pc},{label:'Gesamt',val:(total>=0?'+':'')+total.toFixed(2)+'€',color:pc,big:true},...(margin?[{label:'ROI',val:margin+'%',color:pc}]:[])].map(s=><div key={s.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><span style={{fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>{s.label}</span><span style={{fontSize:s.big?28:15,fontWeight:700,color:s.color,fontFamily:'Syne, sans-serif'}}>{s.val}</span></div>)}
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} style={{width:'100%',background:'#4caf50',color:'#000',border:'none',borderRadius:10,padding:'13px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',marginBottom:showAdd?12:0}}>📦 Zum Lager hinzufügen</button>
        {showAdd&&<div className="fade-in" style={{background:'#0a0a0a',border:'1px solid #1a1a1a',borderRadius:12,padding:'16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div><p style={{margin:'0 0 6px',fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>Name</p><input placeholder="z.B. Samba OG" value={name} onChange={e=>setName(e.target.value)} style={iStyle}/></div>
            <div><p style={{margin:'0 0 6px',fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>Marke</p><input placeholder="Adidas" value={brand} onChange={e=>setBrand(e.target.value)} style={iStyle}/></div>
          </div>
          <button onClick={()=>{if(!bp||!sp)return;onAdd({name:name||'Produkt',brand:brand||'–',avg_price_eur:parseFloat(sp)},bp,qty,sp);setAdded(true);setTimeout(()=>{setAdded(false);setShowAdd(false);setName('');setBrand('');},2000);}} style={{width:'100%',background:added?'#0f2a0f':'#fff',color:added?'#4caf50':'#000',border:added?'1px solid #1a4a1a':'none',borderRadius:8,padding:'11px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>{added?'✓ Hinzugefügt':'Speichern →'}</button>
        </div>}
      </>:<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'50px 20px',textAlign:'center'}}><p style={{fontSize:13,color:'#444'}}>Preise eingeben</p></div>}
    </div>
  );
}

function Inventory({ inventory, onSold, onRemove, onEdit }) {
  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}><h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>📦 Lager</h2><p style={{fontSize:13,color:'#666'}}>{inventory.length} Artikel</p></div>
      {inventory.length===0?<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'50px 20px',textAlign:'center'}}><p style={{fontSize:13,color:'#444'}}>Keine Artikel im Lager</p></div>:inventory.map(item=>{
        const rem=item.qty-item.sold, profit=(item.sellPrice-item.buyPrice)*item.sold;
        return <div key={item.id} className="fade-in" style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:12,padding:'16px',marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
              {item.img&&<img src={item.img} alt={item.name} style={{width:48,height:48,objectFit:'cover',borderRadius:8,border:'1px solid #1a1a1a',flexShrink:0}} onError={e=>{e.target.style.display='none';}}/>}
              <div style={{minWidth:0}}><p style={{margin:'0 0 2px',fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>{item.brand}</p><p style={{margin:0,fontSize:15,fontWeight:700,color:'#fff',fontFamily:'Syne, sans-serif'}}>{item.name}</p><p style={{margin:0,fontSize:10,color:'#333'}}>{item.addedAt}</p></div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>onEdit(item)} style={{background:'transparent',border:'1px solid #1a1a1a',borderRadius:6,padding:'5px 10px',color:'#555',cursor:'pointer',fontSize:10,fontWeight:700}}>✏️</button>
              <button onClick={()=>onRemove(item.id)} style={{background:'none',border:'none',color:'#2a2a2a',cursor:'pointer',fontSize:18,padding:4}}>×</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:12}}>
            {[{label:'Einkauf',val:item.buyPrice+'€'},{label:'Verkauf',val:item.sellPrice+'€'},{label:'Gesamt',val:item.qty+'x'},{label:'Im Lager',val:rem+'x',color:rem>0?'#888':'#4caf50'}].map(s=><div key={s.label} style={{background:'#050505',border:'1px solid #111',borderRadius:6,padding:'8px',textAlign:'center'}}><p style={{margin:'0 0 2px',fontSize:9,color:'#333',letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.label}</p><p style={{margin:0,fontSize:12,fontWeight:700,color:s.color||'#fff',fontFamily:'Syne, sans-serif'}}>{s.val}</p></div>)}
          </div>
          {profit>0&&<div style={{background:'rgba(76,175,80,0.05)',border:'1px solid #1a3a1a',borderRadius:6,padding:'8px 12px',marginBottom:10,display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'#4caf50',textTransform:'uppercase'}}>Gewinn</span><span style={{fontSize:14,fontWeight:700,color:'#4caf50',fontFamily:'Syne, sans-serif'}}>+{profit.toFixed(2)}€</span></div>}
          <button onClick={()=>onSold(item.id)} disabled={rem===0} style={{width:'100%',background:rem>0?'#4caf50':'#0a0a0a',color:rem>0?'#000':'#333',border:rem>0?'none':'1px solid #111',borderRadius:8,padding:'10px',fontSize:11,fontWeight:700,cursor:rem>0?'pointer':'default',fontFamily:'Syne, sans-serif'}}>{rem===0?'✓ Alles verkauft':'1 verkauft'}</button>
        </div>;
      })}
    </div>
  );
}

function EditModal({ item, onClose, onSave }) {
  const [name,setName]=useState(item.name); const [brand,setBrand]=useState(item.brand);
  const [bp,setBp]=useState(String(item.buyPrice)); const [sp,setSp]=useState(String(item.sellPrice));
  const [qty,setQty]=useState(String(item.qty)); const [img,setImg]=useState(item.img||'');
  const handleUpload=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImg(ev.target.result);r.readAsDataURL(f);};
  const iStyle={width:'100%',background:'#080808',border:'1px solid #1a1a1a',borderRadius:8,padding:'11px 14px',fontSize:13,color:'#fff',outline:'none'};
  return (
    <Modal onClose={onClose}>
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><h3 style={{fontSize:18,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif'}}>Artikel bearbeiten</h3><button onClick={onClose} style={{background:'none',border:'none',color:'#555',fontSize:22,cursor:'pointer'}}>×</button></div>
        <div style={{marginBottom:16}}>
          <p style={{margin:'0 0 8px',fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>Produktbild</p>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            {img&&<img src={img} alt="" style={{width:64,height:64,objectFit:'cover',borderRadius:8,border:'1px solid #1a1a1a'}} onError={e=>{e.target.style.display='none';}}/>}
            <label style={{flex:1,background:'#080808',border:'1px dashed #2a2a2a',borderRadius:8,padding:'14px',textAlign:'center',cursor:'pointer',display:'block'}}><input type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}}/><p style={{margin:0,fontSize:12,color:'#555'}}>📷 Bild hochladen</p></label>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          {[{label:'Name',val:name,set:setName,ph:'Samba OG'},{label:'Marke',val:brand,set:setBrand,ph:'Adidas'},{label:'Einkauf €',val:bp,set:setBp,ph:'25',type:'number'},{label:'Verkauf €',val:sp,set:setSp,ph:'65',type:'number'},{label:'Anzahl',val:qty,set:setQty,ph:'1',type:'number'}].map(f=><div key={f.label}><p style={{margin:'0 0 6px',fontSize:10,color:'#444',letterSpacing:'0.08em',textTransform:'uppercase'}}>{f.label}</p><input type={f.type||'text'} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} style={iStyle}/></div>)}
        </div>
        <button onClick={()=>{onSave(item.id,{name,brand,buyPrice:parseFloat(bp)||item.buyPrice,sellPrice:parseFloat(sp)||item.sellPrice,qty:parseInt(qty)||item.qty,img});onClose();}} style={{width:'100%',background:'#4caf50',color:'#000',border:'none',borderRadius:10,padding:'13px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>Speichern ✓</button>
      </div>
    </Modal>
  );
}

function Dashboard({ inventory, stats }) {
  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}><h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>📊 Dashboard</h2><p style={{fontSize:13,color:'#666'}}>Deine Performance</p></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {[{label:'Investiert',val:stats.invested.toFixed(2)+'€',color:'#666'},{label:'Umsatz',val:stats.revenue.toFixed(2)+'€',color:'#fff'},{label:'Gewinn',val:'+'+stats.profit.toFixed(2)+'€',color:stats.profit>0?'#4caf50':'#ff6b6b'},{label:'Im Lager',val:stats.unsold+'',color:'#888'}].map(s=><div key={s.label} className="card-hover" style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:12,padding:'20px'}}><p style={{margin:'0 0 8px',fontSize:10,color:'#444',letterSpacing:'0.1em',textTransform:'uppercase'}}>{s.label}</p><p style={{margin:0,fontSize:26,fontWeight:800,color:s.color,fontFamily:'Syne, sans-serif'}}>{s.val}</p></div>)}
      </div>
      {inventory.length>0&&<div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:12,padding:'20px'}}>
        <p style={{margin:'0 0 14px',fontSize:11,color:'#666',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600}}>🏆 Top Artikel</p>
        {[...inventory].sort((a,b)=>(b.sellPrice-b.buyPrice)*b.sold-(a.sellPrice-a.buyPrice)*a.sold).slice(0,5).map((item,i)=><div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<4?'1px solid #111':'none'}}><div style={{display:'flex',alignItems:'center',gap:12}}><span style={{fontSize:11,color:'#222',fontFamily:'Syne, sans-serif',fontWeight:700,minWidth:18}}>0{i+1}</span><div><p style={{margin:0,fontSize:13,fontWeight:600,color:'#fff',fontFamily:'Syne, sans-serif'}}>{item.name}</p><p style={{margin:0,fontSize:10,color:'#444'}}>{item.sold}/{item.qty} verkauft</p></div></div><span style={{fontSize:14,fontWeight:700,color:'#4caf50',fontFamily:'Syne, sans-serif'}}>+{((item.sellPrice-item.buyPrice)*item.sold).toFixed(2)}€</span></div>)}
      </div>}
    </div>
  );
}

function Impressum({ onBack }) {
  return (
    <div className="fade-in">
      <button onClick={onBack} style={{background:'transparent',border:'1px solid #1a1a1a',borderRadius:8,padding:'7px 14px',color:'#888',fontSize:12,cursor:'pointer',fontFamily:'Syne, sans-serif',fontWeight:600,marginBottom:20}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#4caf50';e.currentTarget.style.color='#fff';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a1a';e.currentTarget.style.color='#888';}}>← Zurück</button>
      <div style={{marginBottom:24}}><h2 style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em',marginBottom:6}}>Impressum</h2><p style={{fontSize:13,color:'#666'}}>Angaben gemäß § 5 TMG</p></div>
      {[{title:'Betreiber',content:['ResellXIQ','Erstellt von Deniz Coban & Miran Simsek','Köln, Deutschland']},{title:'Kontakt',content:['E-Mail: miransimsek42@gmail.com']},{title:'Haftungsausschluss',content:['Die KI-generierten Preiseinschätzungen sind unverbindliche Empfehlungen.']},{title:'Datenschutz',content:['E-Mail und Passwort werden bei Supabase (EU-Server, Frankfurt) gespeichert.']}].map((s,i)=><div key={i} style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'20px',marginBottom:12}}><p style={{margin:'0 0 12px',fontSize:11,color:'#4caf50',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700}}>{s.title}</p>{s.content.map((line,j)=><p key={j} style={{margin:j<s.content.length-1?'0 0 6px':0,fontSize:13,color:'#aaa',lineHeight:1.7}}>{line.includes('@')?<a href={`mailto:${line.split(': ')[1]}`} style={{color:'#4caf50',textDecoration:'none'}}>{line}</a>:line}</p>)}</div>)}
      <div style={{background:'#0a0a0a',border:'1px solid #111',borderRadius:14,padding:'16px',textAlign:'center',marginTop:20}}><p style={{fontSize:11,color:'#333'}}>© 2025 ResellXIQ · Deniz Coban & Miran Simsek · Köln</p></div>
    </div>
  );
}

export default function ResellXIQ() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('resellxiq_user'))||null;}catch{return null;}});
  const [showLogin,setShowLogin]=useState(false);
  const [showAgb,setShowAgb]=useState(()=>!localStorage.getItem('resellxiq_agb'));
  const [showLicense,setShowLicense]=useState(false);
  const [upgradeReq,setUpgradeReq]=useState(null);
  const [lang,setLang]=useState('de');
  const [page,setPage]=useState('home');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [selectedItem,setSelectedItem]=useState(null);
  const [editingItem,setEditingItem]=useState(null);
  const [inventory,setInventory]=useState([]);
  const t=T[lang];
  const plan=user?.plan||'starter';

  const handleLogin=u=>{setUser(u);localStorage.setItem('resellxiq_user',JSON.stringify(u));setShowLogin(false);};
  const handleLogout=()=>{setUser(null);localStorage.removeItem('resellxiq_user');setPage('home');};
  const handleAgbAccept=()=>{localStorage.setItem('resellxiq_agb','1');setShowAgb(false);};
  const handlePageChange=p=>{
    if(!user&&p!=='home'&&p!=='impressum'){setShowLogin(true);return;}
    setPage(p);setSidebarOpen(false);
  };

  const addToInventory=(item,bp,qty,sp)=>setInventory(prev=>[{id:Date.now(),name:item.name,brand:item.brand,buyPrice:parseFloat(bp),sellPrice:parseFloat(sp)||item.avg_price_eur,qty:parseInt(qty),sold:0,addedAt:new Date().toLocaleDateString('de-DE'),img:item.img},...prev]);
  const markSold=id=>setInventory(prev=>prev.map(i=>i.id===id&&i.sold<i.qty?{...i,sold:i.sold+1}:i));
  const removeItem=id=>setInventory(prev=>prev.filter(i=>i.id!==id));
  const updateItem=(id,updates)=>setInventory(prev=>prev.map(i=>i.id===id?{...i,...updates}:i));
  const stats=useMemo(()=>({invested:inventory.reduce((s,i)=>s+i.buyPrice*i.qty,0),revenue:inventory.reduce((s,i)=>s+i.sellPrice*i.sold,0),profit:inventory.reduce((s,i)=>s+(i.sellPrice-i.buyPrice)*i.sold,0),unsold:inventory.reduce((s,i)=>s+(i.qty-i.sold),0)}),[inventory]);

  const NAV=[{id:'home',label:t.nav.home,icon:'🏠'},{id:'scan',label:t.nav.scan,icon:'📸'},{id:'analyzer',label:t.nav.analyzer,icon:'🔍'},{id:'trends',label:t.nav.trends,icon:'🔥'},{id:'chat',label:t.nav.chat,icon:'💬'},{id:'calc',label:t.nav.calc,icon:'💰'},{id:'inventory',label:t.nav.inventory,icon:'📦'},{id:'vendors',label:t.nav.vendors,icon:'🏷️'},{id:'dashboard',label:t.nav.dashboard,icon:'📊'},{id:'impressum',label:'Impressum',icon:'📄'}];

  return (
    <div style={{minHeight:'100vh',background:'#050505',width:'100%'}}>
      <style>{ROOT_CSS}</style>
      {showAgb&&<AgbModal onAccept={handleAgbAccept}/>}
      <header style={{position:'fixed',top:0,left:0,right:0,height:56,background:'rgba(5,5,5,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid #111',zIndex:200,display:'flex',alignItems:'center',padding:'0 20px',gap:12}}>
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:'transparent',border:'1px solid #1a1a1a',borderRadius:8,padding:'6px 10px',color:'#fff',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#4caf50'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1a1a1a'}><span style={{fontSize:14}}>☰</span></button>
        <div onClick={()=>setPage('home')} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flex:1}}>
          <div style={{width:26,height:26,background:'#4caf50',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:13,color:'#000',fontWeight:900,fontFamily:'Syne, sans-serif'}}>X</span></div>
          <span style={{fontSize:16,fontWeight:800,color:'#fff',fontFamily:'Syne, sans-serif',letterSpacing:'-0.02em'}}>ResellXIQ</span>
        </div>
        <div style={{display:'flex',background:'#0d0d0d',border:'1px solid #1a1a1a',borderRadius:6,overflow:'hidden'}}>
          {['de','en'].map(l=><button key={l} onClick={()=>setLang(l)} style={{background:lang===l?'#4caf50':'transparent',color:lang===l?'#000':'#444',border:'none',padding:'5px 10px',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>{l.toUpperCase()}</button>)}
        </div>
        {user?<div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:10,color:PLAN_LIMITS[plan]?.color,background:'rgba(76,175,80,0.1)',border:'1px solid #1a3a1a',borderRadius:10,padding:'3px 8px',fontWeight:700}}>{plan.toUpperCase()}</span><button onClick={handleLogout} style={{background:'transparent',border:'1px solid #1a3a1a',borderRadius:8,padding:'6px 12px',color:'#4caf50',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',whiteSpace:'nowrap'}}>{user.email?.split('@')[0]} ↓</button></div>:<button onClick={()=>setShowLogin(true)} style={{background:'#4caf50',border:'none',borderRadius:8,padding:'7px 14px',color:'#000',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',whiteSpace:'nowrap'}}>{t.login}</button>}
      </header>
      <aside style={{position:'fixed',top:56,left:sidebarOpen?0:-260,width:260,height:'calc(100vh - 56px)',background:'#080808',borderRight:'1px solid #111',padding:'20px 14px',overflowY:'auto',zIndex:150,transition:'left 0.3s cubic-bezier(0.16,1,0.3,1)'}}>
        <p style={{margin:'0 0 14px 4px',fontSize:9,color:'#333',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600}}>Navigation</p>
        {NAV.map(item=><button key={item.id} onClick={()=>handlePageChange(item.id)} className={`nav-item ${page===item.id?'active':''}`} style={{width:'100%',display:'flex',alignItems:'center',gap:12,background:page===item.id?'#4caf50':'transparent',color:page===item.id?'#000':'#666',border:page===item.id?'1px solid #4caf50':'1px solid transparent',borderRadius:8,padding:'11px 14px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Syne, sans-serif',marginBottom:4,textAlign:'left'}}><span style={{fontSize:14}}>{item.icon}</span><span>{item.label}</span></button>)}
        <div style={{marginTop:30,paddingTop:20,borderTop:'1px solid #111'}}>
          {user?<div style={{padding:'10px 14px',background:'rgba(76,175,80,0.05)',border:'1px solid #1a3a1a',borderRadius:8}}>
            <p style={{margin:'0 0 2px',fontSize:10,color:'#4caf50',letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:700}}>✓ {plan.toUpperCase()}</p>
            <p style={{margin:'0 0 8px',fontSize:11,color:'#666'}}>{user.email}</p>
            <button onClick={()=>{setShowLicense(true);setSidebarOpen(false);}} style={{width:'100%',background:'transparent',border:'1px solid #1a3a1a',borderRadius:6,padding:'6px 10px',color:'#4caf50',fontSize:10,cursor:'pointer',fontFamily:'Syne, sans-serif',fontWeight:700,marginBottom:6}}>🔑 Lizenz eingeben</button>
            <button onClick={handleLogout} style={{background:'transparent',border:'1px solid #1a1a1a',borderRadius:6,padding:'5px 10px',color:'#555',fontSize:10,cursor:'pointer',fontFamily:'Syne, sans-serif',fontWeight:700}}>{t.logout}</button>
          </div>:<button onClick={()=>{setShowLogin(true);setSidebarOpen(false);}} style={{width:'100%',background:'#4caf50',border:'none',borderRadius:8,padding:'11px',color:'#000',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif'}}>{t.login} / {t.register}</button>}
        </div>
      </aside>
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,top:56,background:'rgba(0,0,0,0.5)',zIndex:140,backdropFilter:'blur(4px)'}}/>}
      <main style={{paddingTop:56,minHeight:'100vh'}}>
        {page==='home'?<LandingPage lang={lang} onLogin={()=>setShowLogin(true)} onImpressum={()=>setPage('impressum')}/>:(
          <div style={{maxWidth:720,margin:'0 auto',padding:'24px 20px'}}>
            {page==='scan'&&<PhotoScan lang={lang} onAddInventory={addToInventory} plan={plan}/>}
            {page==='analyzer'&&<ListingAnalyzer plan={plan} onUpgrade={setUpgradeReq}/>}
            {page==='trends'&&<Trends lang={lang} onSelect={setSelectedItem}/>}
            {page==='chat'&&<AiChat lang={lang} plan={plan} onUpgrade={setUpgradeReq}/>}
            {page==='calc'&&<Calculator onAdd={addToInventory}/>}
            {page==='inventory'&&<Inventory inventory={inventory} onSold={markSold} onRemove={removeItem} onEdit={setEditingItem}/>}
            {page==='vendors'&&<VendorDirectory plan={plan} onUpgrade={setUpgradeReq}/>}
            {page==='dashboard'&&<Dashboard inventory={inventory} stats={stats}/>}
            {page==='impressum'&&<Impressum onBack={()=>setPage('home')}/>}
          </div>
        )}
      </main>
      {showLogin&&<LoginModal lang={lang} onLogin={handleLogin} onClose={()=>setShowLogin(false)}/>}
      {showLicense&&user&&<LicenseModal user={user} onActivated={newPlan=>{const u={...user,plan:newPlan};setUser(u);localStorage.setItem('resellxiq_user',JSON.stringify(u));setShowLicense(false);}} onClose={()=>setShowLicense(false)}/>}
      {upgradeReq&&<UpgradeModal requiredPlan={upgradeReq} onClose={()=>setUpgradeReq(null)} onLicense={()=>{setUpgradeReq(null);setShowLicense(true);}}/>}
      {selectedItem&&<ItemModal item={selectedItem} onClose={()=>setSelectedItem(null)} onAdd={addToInventory}/>}
      {editingItem&&<EditModal item={editingItem} onClose={()=>setEditingItem(null)} onSave={updateItem}/>}
    </div>
  );
}
