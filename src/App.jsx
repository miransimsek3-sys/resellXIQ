import { useState, useMemo, useEffect, useRef } from 'react';

const ANTHROPIC_KEY =
  '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';
const SUPABASE_URL = 'https://bwjehefepaqfkplwboud.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3amVoZWZlcGFxZmtwbHdib3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzUzODUsImV4cCI6MjA5NTM1MTM4NX0.LvCu_gLq-hez326Z3OMw4q6w95DnHtmAWv3l7hoAwgk';

async function sbAuth(action, email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${action}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.error || data.error_description)
    throw new Error(data.error_description || data.error?.message || 'Fehler');
  return data;
}

async function callClaude(messages, system = '', useSearch = false) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': ANTHROPIC_KEY,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages,
      ...(system ? { system } : {}),
      ...(useSearch
        ? { tools: [{ type: 'web_search_20250305', name: 'web_search' }] }
        : {}),
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (
    data.content?.map((i) => (i.type === 'text' ? i.text : '')).join('') || ''
  );
}

const T = {
  de: {
    tagline: 'DEIN VINTED CO-PILOT',
    heroTitle: 'Dein nächstes Inserat',
    heroHighlight: 'in 10 Sekunden.',
    heroDesc:
      'Mach ein Foto von deinem Artikel – ResellXIQ schreibt den Titel, die Beschreibung, schlägt den Preis vor und erstellt die Hashtags. Direkt für Vinted.',
    ctaPrimary: 'Jetzt Inserat erstellen →',
    ctaSecondary: 'Wie es funktioniert',
    stats: ['10 Sek pro Inserat', '240+ Vendors', 'Kostenlos starten'],
    nav: {
      home: 'Start',
      scan: 'Foto Scan',
      analyzer: 'Analyzer',
      trends: 'Trends',
      chat: 'KI Chat',
      calc: 'Rechner',
      inventory: 'Lager',
      vendors: 'Vendors',
      dashboard: 'Dashboard',
    },
    login: 'Einloggen',
    register: 'Registrieren',
    logout: 'Abmelden',
    guest: 'Als Gast',
    email: 'E-Mail',
    password: 'Passwort',
    loginBtn: 'Einloggen →',
    registerBtn: 'Registrieren →',
  },
  en: {
    tagline: 'YOUR VINTED CO-PILOT',
    heroTitle: 'Your next listing',
    heroHighlight: 'in 10 seconds.',
    heroDesc:
      'Take a photo of your item — AI writes the title, description, suggests the price and creates hashtags. Ready for Vinted.',
    ctaPrimary: 'Create Listing Now →',
    ctaSecondary: 'How it works',
    stats: ['10 sec per listing', '240+ Vendors', 'Start for free'],
    nav: {
      home: 'Home',
      scan: 'Photo Scan',
      analyzer: 'Analyzer',
      trends: 'Trends',
      chat: 'AI Chat',
      calc: 'Calculator',
      inventory: 'Inventory',
      vendors: 'Vendors',
      dashboard: 'Dashboard',
    },
    login: 'Sign In',
    register: 'Register',
    logout: 'Sign Out',
    guest: 'As Guest',
    email: 'Email',
    password: 'Password',
    loginBtn: 'Sign In →',
    registerBtn: 'Register →',
  },
};

const TREND_ITEMS = [
  {
    name: 'Cardholder',
    brand: 'Goyard',
    hype_score: 98,
    avg_price_eur: 180,
    sell_speed: 'extrem schnell',
    trend_reason: 'Ikonisches Luxus-Accessoire viral bei Gen Z.',
    tip: 'Echtheitsnachweis im Bild zeigen.',
    img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80',
  },
  {
    name: 'Samba OG',
    brand: 'Adidas',
    hype_score: 96,
    avg_price_eur: 80,
    sell_speed: 'extrem schnell',
    trend_reason: 'Meistverkaufter Sneaker in Europa 2025.',
    tip: 'Originalbox mitverkaufen – +15-20€.',
    img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
  },
  {
    name: 'Jordan 1 Retro',
    brand: 'Jordan',
    hype_score: 93,
    avg_price_eur: 140,
    sell_speed: 'extrem schnell',
    trend_reason: 'Meistgesuchter Basketball-Sneaker auf Vinted.',
    tip: 'Colorway-Name ausschreiben.',
    img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80',
  },
  {
    name: 'Cargo Pants',
    brand: 'Carhartt',
    hype_score: 92,
    avg_price_eur: 55,
    sell_speed: 'extrem schnell',
    trend_reason: 'Workwear-Ästhetik dominiert Streetwear 2025.',
    tip: 'M und L verkaufen sich am schnellsten.',
    img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80',
  },
  {
    name: 'Puffer Jacket',
    brand: 'The North Face',
    hype_score: 91,
    avg_price_eur: 110,
    sell_speed: 'extrem schnell',
    trend_reason: 'TNF Nuptse meistverkauftes Winterstück.',
    tip: 'Farbfoto bei Tageslicht.',
    img: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=400&q=80',
  },
  {
    name: "Levi's 501",
    brand: "Levi's",
    hype_score: 91,
    avg_price_eur: 45,
    sell_speed: 'extrem schnell',
    trend_reason: "Vintage Levi's 501 meistverkauftes Vintage-Stück.",
    tip: 'Innenwaschzettel fotografieren.',
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
  },
  {
    name: 'Air Force 1',
    brand: 'Nike',
    hype_score: 90,
    avg_price_eur: 65,
    sell_speed: 'sehr schnell',
    trend_reason: 'Zeitloser Klassiker.',
    tip: 'Weiß/Weiß meistgesucht.',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  },
  {
    name: 'Shorts',
    brand: 'Corteiz',
    hype_score: 90,
    avg_price_eur: 60,
    sell_speed: 'sehr schnell',
    trend_reason: 'Heißestes Underground-Label in Europa.',
    tip: 'Marke groß in den Titel.',
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80',
  },
];

const VENDORS = [
  {
    name: 'Vinted DE',
    category: 'Marketplace',
    url: 'https://vinted.de',
    desc: 'Größter Second-Hand Marktplatz in Deutschland',
    premium: false,
  },
  {
    name: 'Vinted FR',
    category: 'Marketplace',
    url: 'https://vinted.fr',
    desc: 'Vinted Frankreich – oft günstigere Preise',
    premium: false,
  },
  {
    name: 'Depop',
    category: 'Marketplace',
    url: 'https://depop.com',
    desc: 'Streetwear & Vintage Marktplatz – Gen Z fokussiert',
    premium: false,
  },
  {
    name: 'eBay Kleinanzeigen',
    category: 'Marketplace',
    url: 'https://kleinanzeigen.de',
    desc: 'Lokaler Verkauf in Deutschland',
    premium: false,
  },
  {
    name: 'Grailed',
    category: 'Marketplace',
    url: 'https://grailed.com',
    desc: 'Designer & Streetwear für Männer',
    premium: false,
  },
  {
    name: 'Vestiaire Collective',
    category: 'Luxury',
    url: 'https://vestiairecollective.com',
    desc: 'Authentifizierter Luxus Second-Hand',
    premium: true,
  },
  {
    name: 'StockX',
    category: 'Sneakers',
    url: 'https://stockx.com',
    desc: 'Sneaker Authentifikation & Preisindex',
    premium: false,
  },
  {
    name: 'GOAT',
    category: 'Sneakers',
    url: 'https://goat.com',
    desc: 'Premium Sneaker Marktplatz',
    premium: false,
  },
  {
    name: 'Rebelle',
    category: 'Luxury',
    url: 'https://rebelle.com',
    desc: 'Authentifizierte Designer Mode',
    premium: true,
  },
  {
    name: 'Momox Fashion',
    category: 'Marketplace',
    url: 'https://momoxfashion.com',
    desc: 'Verkauf an Momox – fester Preis',
    premium: false,
  },
  {
    name: 'Sellpy',
    category: 'Marketplace',
    url: 'https://sellpy.de',
    desc: 'Komplett-Service Reselling',
    premium: false,
  },
  {
    name: 'Wholesale7',
    category: 'Wholesale',
    url: 'https://wholesale7.net',
    desc: 'Großhandel China – Kleidung',
    premium: true,
  },
  {
    name: 'Alibaba',
    category: 'Wholesale',
    url: 'https://alibaba.com',
    desc: 'Größter B2B Marktplatz',
    premium: true,
  },
  {
    name: 'Carousell',
    category: 'Marketplace',
    url: 'https://carousell.com',
    desc: 'Asiatischer Marktplatz',
    premium: false,
  },
  {
    name: 'Poshmark',
    category: 'Marketplace',
    url: 'https://poshmark.com',
    desc: 'US-Marktplatz für Mode',
    premium: false,
  },
];

const ROOT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  * { font-stretch: normal !important; }
  h1, h2, h3, h4, h5, h6 { font-stretch: normal; letter-spacing: normal; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100vh; margin: 0; padding: 0; background: #050505; overflow-x: hidden; }
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
  .btn-primary { transition: all 0.2s ease; }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  input::placeholder { color: #333; }
  input:focus { border-color: #4caf50 !important; outline: none; }
  a { color: inherit; text-decoration: none; }
`;

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────────
function LoginModal({ onClose, onLogin, lang }) {
  const t = T[lang];
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'login') {
        const data = await sbAuth('token?grant_type=password', email, password);
        onLogin({
          token: data.access_token,
          email: data.user?.email,
          id: data.user?.id,
        });
        onClose();
      } else {
        await sbAuth('signup', email, password);
        setSuccess(
          lang === 'de'
            ? '✅ Konto erstellt! Du kannst dich jetzt einloggen.'
            : '✅ Account created! You can now sign in.'
        );
        setMode('login');
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const iStyle = {
    width: '100%',
    background: '#080808',
    border: '1px solid #1a1a1a',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    color: '#fff',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="scale-in"
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#0d0d0d',
          border: '1px solid #1e1e1e',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: '#4caf50',
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#000',
                  fontWeight: 900,
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                X
              </span>
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              ResellXIQ
            </span>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 3,
              background: '#080808',
              borderRadius: 10,
              padding: 3,
              marginBottom: 20,
            }}
          >
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  flex: 1,
                  background: mode === m ? '#4caf50' : 'transparent',
                  color: mode === m ? '#000' : '#444',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                {m === 'login' ? t.login : t.register}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {t.email}
            </p>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={iStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {t.password}
            </p>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              style={iStyle}
            />
          </div>
          {error && (
            <div
              style={{
                background: '#0a0000',
                border: '1px solid #2a0000',
                borderRadius: 8,
                padding: '9px 12px',
                marginBottom: 12,
                fontSize: 12,
                color: '#ff6b6b',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: '#0a1a0a',
                border: '1px solid #1a4a1a',
                borderRadius: 8,
                padding: '9px 12px',
                marginBottom: 12,
                fontSize: 12,
                color: '#4caf50',
              }}
            >
              {success}
            </div>
          )}
          <button
            onClick={handle}
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              background: '#4caf50',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: '13px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              opacity: email && password ? 1 : 0.4,
              marginBottom: 10,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? '...' : mode === 'login' ? t.loginBtn : t.registerBtn}
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#444',
              border: '1px solid #1a1a1a',
              borderRadius: 10,
              padding: '11px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {t.guest}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ lang, onStart }) {
  const t = T[lang];
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a1a0a 0%, #050505 60%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Green glow */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          background:
            'radial-gradient(circle, rgba(76,175,80,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="fade-in"
        style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 28,
            padding: '6px 16px',
            background: 'rgba(76,175,80,0.1)',
            border: '1px solid rgba(76,175,80,0.3)',
            borderRadius: 20,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: '#4caf50',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: '#4caf50',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            {lang === 'de'
              ? 'Foto hochladen · Fertig. So einfach.'
              : 'Upload photo · Done. That simple.'}
          </span>
        </div>

        {/* ALL GREEN headline */}
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 7vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginBottom: 28,
            fontFamily: 'Syne, sans-serif',
            color: '#4caf50',
          }}
        >
          {t.heroTitle}
          <br />
          {t.heroHighlight}
        </h1>

        <p
          style={{
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: '#888',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 44px',
          }}
        >
          {t.heroDesc}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 64,
          }}
        >
          <button
            onClick={() => onStart('scan')}
            style={{
              background: '#4caf50',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              padding: '16px 32px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              animation: 'glow 2s ease-in-out infinite',
            }}
          >
            {t.ctaPrimary}
          </button>
          <button
            onClick={() => onStart('trends')}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid #2a2a2a',
              borderRadius: 12,
              padding: '16px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = '#4caf50')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = '#2a2a2a')
            }
          >
            {t.ctaSecondary}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          {t.stats.map((s, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: '#4caf50',
                  borderRadius: '50%',
                }}
              />
              <span
                style={{ fontSize: 12, color: '#666', letterSpacing: '0.05em' }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          marginTop: 80,
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          borderTop: '1px solid #111',
          paddingTop: 30,
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: '#333',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 8,
          }}
        >
          © 2025 ResellXIQ · Deniz Coban & Miran Simsek · Köln
        </p>
        <button
          onClick={() => onStart('impressum')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4caf50',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'underline',
          }}
        >
          Impressum
        </button>
      </div>

      {/* How it works */}
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          marginTop: 100,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              fontSize: 10,
              color: '#4caf50',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 14,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
            }}
          >
            WIE ES FUNKTIONIERT
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '-0.02em',
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            {lang === 'de'
              ? 'Mehr verkaufen. Weniger Zeit verschwenden.'
              : 'Sell more. Waste less time.'}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#666',
              lineHeight: 1.7,
              maxWidth: 500,
              margin: '0 auto',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {lang === 'de'
              ? 'Während andere noch tippen, hast du deine Anzeige schon online. ResellXIQ macht in 10 Sekunden was andere in 10 Minuten schaffen – und das besser.'
              : 'While others are still typing, your listing is already live. ResellXIQ does in 10 seconds what others take 10 minutes to do — and better.'}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {[
            {
              icon: '📸',
              step: '01',
              title: lang === 'de' ? 'Foto machen' : 'Take a photo',
              desc:
                lang === 'de'
                  ? 'Einfach den Artikel fotografieren – kein Setup, kein Aufwand.'
                  : 'Simply photograph your item — no setup, no effort.',
            },
            {
              icon: '🤖',
              step: '02',
              title: lang === 'de' ? 'KI analysiert' : 'AI analyzes',
              desc:
                lang === 'de'
                  ? 'Unsere KI erkennt das Produkt, schätzt den Marktpreis und checkt den aktuellen Trend.'
                  : 'Our AI identifies the product, estimates market price and checks the current trend.',
            },
            {
              icon: '✨',
              step: '03',
              title: lang === 'de' ? 'Anzeige fertig' : 'Listing ready',
              desc:
                lang === 'de'
                  ? 'Titel, Beschreibung und Hashtags – fertig zum Einfügen auf Vinted, eBay oder Kleinanzeigen.'
                  : 'Title, description and hashtags — ready to paste on Vinted, eBay or Kleinanzeigen.',
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: '#0a0a0a',
                border: '1px solid #111',
                borderRadius: 14,
                padding: '24px 20px',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  fontSize: 10,
                  color: '#1a1a1a',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                }}
              >
                {f.step}
              </span>
              <span
                style={{ fontSize: 28, display: 'block', marginBottom: 14 }}
              >
                {f.icon}
              </span>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'Syne, sans-serif',
                  marginBottom: 8,
                }}
              >
                {f.title}
              </p>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div
          style={{
            background: 'rgba(76,175,80,0.04)',
            border: '1px solid #1a3a1a',
            borderRadius: 14,
            padding: '24px',
            marginBottom: 80,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: '#4caf50',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {lang === 'de' ? '🤝 Gemeinsam stärker' : '🤝 Stronger together'}
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            {lang === 'de'
              ? 'Wir arbeiten mit hunderten Resellern zusammen.'
              : 'We work together with hundreds of resellers.'}
          </p>
          <p
            style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 1.7,
              maxWidth: 500,
              margin: '0 auto',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {lang === 'de'
              ? 'Von Köln bis Berlin – unsere Community teilt Trends, Tipps und Strategien. Du bist nicht allein. Wir skalieren gemeinsam.'
              : 'From Cologne to Berlin — our community shares trends, tips and strategies. You are not alone. We scale together.'}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              marginTop: 20,
              flexWrap: 'wrap',
            }}
          >
            {[
              ['500+', lang === 'de' ? 'Aktive Reseller' : 'Active Resellers'],
              [
                '10K+',
                lang === 'de' ? 'Inserate erstellt' : 'Listings created',
              ],
              ['4.9★', lang === 'de' ? 'Bewertung' : 'Rating'],
            ].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#4caf50',
                    fontFamily: 'Syne, sans-serif',
                    letterSpacing: '-0.02em',
                    marginBottom: 4,
                  }}
                >
                  {val}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: '#444',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              fontSize: 10,
              color: '#4caf50',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 14,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
            }}
          >
            PRICING
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}
          >
            {lang === 'de'
              ? 'Starte kostenlos. Wachse schneller.'
              : 'Start free. Grow faster.'}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#666',
              lineHeight: 1.7,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {lang === 'de'
              ? 'Kein Vertrag. Jederzeit kündbar.'
              : 'No contract. Cancel anytime.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* FREE */}
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #111',
              borderRadius: 16,
              padding: '28px 22px',
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 12,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              STARTER
            </p>
            <p
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              0€
            </p>
            <p
              style={{
                fontSize: 11,
                color: '#444',
                marginBottom: 24,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {lang === 'de' ? 'Kostenlos' : 'Forever free'}
            </p>
            {[
              '2 Foto Scans pro Tag',
              '2 Analyzer Checks',
              'Trends & Rechner',
              'KI Chat (5 Nachrichten)',
              'Basis Vendor Liste',
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <span style={{ color: '#333', fontSize: 12, marginTop: 1 }}>
                  ○
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#666',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.4,
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
            <button
              onClick={() => onStart('scan')}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #222',
                borderRadius: 10,
                padding: '12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                marginTop: 20,
              }}
            >
              {lang === 'de' ? 'Kostenlos starten' : 'Start free'}
            </button>
          </div>

          {/* PRO */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0a1a0a, #050505)',
              border: '1px solid #4caf50',
              borderRadius: 16,
              padding: '28px 22px',
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: '#4caf50',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 12,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              PRO
            </p>
            <p
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              9,99€
            </p>
            <p
              style={{
                fontSize: 11,
                color: '#666',
                marginBottom: 24,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {lang === 'de' ? 'pro Monat' : 'per month'}
            </p>
            {[
              '✓ Alles aus Starter',
              '✓ 20 Foto Scans pro Tag',
              '✓ Unlimitierter KI Chat',
              '✓ 10 Analyzer Checks',
              '✓ Vollständige Vendor Liste',
              '✓ Lager & Dashboard',
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    color: '#4caf50',
                    fontSize: 12,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#aaa',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.4,
                  }}
                >
                  {f.replace('✓ ', '')}
                </span>
              </div>
            ))}
            <button
              onClick={() => onStart('scan')}
              style={{
                width: '100%',
                background: '#4caf50',
                color: '#000',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                marginTop: 20,
              }}
            >
              {lang === 'de' ? 'Pro starten →' : 'Start Pro →'}
            </button>
          </div>

          {/* BUSINESS */}
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: 16,
              padding: '28px 22px',
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: '#888',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 12,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              BUSINESS
            </p>
            <p
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              19,99€
            </p>
            <p
              style={{
                fontSize: 11,
                color: '#444',
                marginBottom: 24,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {lang === 'de' ? 'pro Monat' : 'per month'}
            </p>
            {[
              '✓ Alles aus Pro',
              '✓ Unlimitierte Foto Scans',
              '✓ Unlimitierter Analyzer',
              '✓ Premium Vendor Directory',
              '✓ Preis-Alerts & Benachrichtigungen',
              '✓ Priorität Support',
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#aaa',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.4,
                  }}
                >
                  {f.replace('✓ ', '')}
                </span>
              </div>
            ))}
            <button
              onClick={() => onStart('scan')}
              style={{
                width: '100%',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                marginTop: 20,
              }}
            >
              {lang === 'de' ? 'Business starten →' : 'Start Business →'}
            </button>
          </div>

          {/* ELITE */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d0d0d, #050505)',
              border: '1px solid #fff',
              borderRadius: 16,
              padding: '28px 22px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff',
                borderRadius: 20,
                padding: '3px 14px',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: '#000',
                  fontWeight: 800,
                  fontFamily: 'Syne, sans-serif',
                  letterSpacing: '0.1em',
                }}
              >
                ⭐ BELIEBT
              </span>
            </div>
            <p
              style={{
                fontSize: 10,
                color: '#fff',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 12,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ELITE
            </p>
            <p
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              26,99€
            </p>
            <p
              style={{
                fontSize: 11,
                color: '#444',
                marginBottom: 24,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {lang === 'de' ? 'pro Monat' : 'per month'}
            </p>
            {[
              '✓ Alles aus Business',
              '✓ Persönliche Marktanalysen',
              '✓ Exklusive Elite Vendor Deals',
              '✓ Früher Zugang zu neuen Features',
              '✓ Direkt-Support via WhatsApp',
              '✓ Monatlicher Trend Report',
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#aaa',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.4,
                  }}
                >
                  {f.replace('✓ ', '')}
                </span>
              </div>
            ))}
            <button
              onClick={() => onStart('scan')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #333, #111)',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 10,
                padding: '13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                marginTop: 20,
              }}
            >
              {lang === 'de' ? 'Elite werden →' : 'Go Elite →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PHOTO SCAN ───────────────────────────────────────────────────────────────
function PhotoScan({ lang, onAddInventory }) {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setImageData(ev.target.result.split(',')[1]);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'x-api-key': ANTHROPIC_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1200,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageData,
                  },
                },
                {
                  type: 'text',
                  text: `Du bist Vinted Reselling Experte. Analysiere das Foto und antworte NUR als JSON:\n{"product_name":"Name","brand":"Marke","category":"Kategorie","condition":"Sehr gut","estimated_price_eur":45,"price_range":"X-Y€","hype_score":75,"sell_speed":"sehr schnell","trend":"steigend","listing_title":"Titel max 60 Zeichen","listing_description":"3 Sätze auf ${
                    lang === 'de' ? 'Deutsch' : 'Englisch'
                  } verkaufsstark","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5","tips":["Tipp1","Tipp2"],"buy_recommendation":"ja","reason":"Begründung auf ${
                    lang === 'de' ? 'Deutsch' : 'Englisch'
                  }"}`,
                },
              ],
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text =
        data.content?.map((i) => (i.type === 'text' ? i.text : '')).join('') ||
        '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) setResult(JSON.parse(match[0]));
      else
        setError(
          lang === 'de' ? 'Analyse fehlgeschlagen.' : 'Analysis failed.'
        );
    } catch (e) {
      setError('Error: ' + e.message);
    }
    setLoading(false);
  };

  const listing = result
    ? `${result.listing_title}\n\n${result.listing_description}\n\n${result.hashtags}`
    : '';
  const handleAdd = () => {
    if (!result) return;
    onAddInventory(
      {
        name: result.product_name,
        brand: result.brand,
        avg_price_eur: result.estimated_price_eur,
        img: image,
      },
      '0',
      '1',
      String(result.estimated_price_eur)
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          📸 {lang === 'de' ? 'Foto Scan' : 'Photo Scan'}
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {lang === 'de'
            ? 'Foto hochladen → KI erkennt Produkt, schätzt Preis & schreibt Anzeige'
            : 'Upload photo → AI identifies product, estimates price & writes listing'}
        </p>
      </div>
      <label style={{ display: 'block', cursor: 'pointer', marginBottom: 16 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <div
          style={{
            background: '#0a0a0a',
            border: '1px dashed ' + (image ? '#333' : '#222'),
            borderRadius: 14,
            overflow: 'hidden',
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {image ? (
            <>
              <img
                src={image}
                alt="upload"
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: 8,
                  padding: '5px 10px',
                }}
              >
                <span style={{ fontSize: 11, color: '#aaa' }}>
                  {lang === 'de' ? 'Tippen zum Ändern' : 'Tap to change'}
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📸</div>
              <p
                style={{
                  fontSize: 15,
                  color: '#888',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {lang === 'de' ? 'Foto hochladen' : 'Upload Photo'}
              </p>
              <p style={{ fontSize: 12, color: '#333' }}>
                {lang === 'de' ? 'Kamera oder Galerie' : 'Camera or gallery'}
              </p>
            </div>
          )}
        </div>
      </label>
      {image && !result && (
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            width: '100%',
            background: '#4caf50',
            color: '#000',
            border: 'none',
            borderRadius: 12,
            padding: '15px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
            marginBottom: 16,
          }}
        >
          {loading
            ? lang === 'de'
              ? 'KI analysiert...'
              : 'Analyzing...'
            : lang === 'de'
            ? '🔍 Produkt analysieren'
            : '🔍 Analyze Product'}
        </button>
      )}
      {loading && (
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 14,
            padding: '40px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '2px solid #1a1a1a',
              borderTop: '2px solid #4caf50',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <p
            style={{
              fontSize: 14,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
            }}
          >
            {lang === 'de'
              ? 'KI erkennt dein Produkt...'
              : 'AI is identifying...'}
          </p>
        </div>
      )}
      {error && (
        <div
          style={{
            background: '#0a0000',
            border: '1px solid #2a0000',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#ff6b6b',
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {result && !loading && (
        <div className="fade-in">
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #111',
              borderRadius: 14,
              padding: '20px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    color: '#444',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {result.brand}
                </p>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#fff',
                    fontFamily: 'Syne, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {result.product_name}
                </p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {result.category} · {result.condition}
                </p>
              </div>
              <div
                style={{
                  background:
                    result.buy_recommendation === 'ja'
                      ? '#4caf50'
                      : result.buy_recommendation === 'nein'
                      ? '#1a0000'
                      : '#1a1a00',
                  borderRadius: 8,
                  padding: '5px 12px',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color:
                      result.buy_recommendation === 'ja'
                        ? '#000'
                        : result.buy_recommendation === 'nein'
                        ? '#ff6b6b'
                        : '#ffcc00',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {result.buy_recommendation === 'ja'
                    ? '✓ KAUFEN'
                    : result.buy_recommendation === 'nein'
                    ? '✗ SKIP'
                    : '~ MAYBE'}
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
              }}
            >
              {[
                {
                  label: lang === 'de' ? 'PREIS' : 'PRICE',
                  value: result.price_range,
                },
                { label: 'HYPE', value: result.hype_score + '/100' },
                { label: 'TREND', value: result.trend },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#050505',
                    borderRadius: 10,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      color: '#333',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            {result.reason && (
              <div
                style={{
                  marginTop: 14,
                  padding: '11px 13px',
                  background: '#050505',
                  borderRadius: 8,
                }}
              >
                <p style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>
                  {result.reason}
                </p>
              </div>
            )}
          </div>
          <div
            style={{
              background: 'rgba(76,175,80,0.04)',
              border: '1px solid #1a3a1a',
              borderRadius: 14,
              padding: '20px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#4caf50',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                ✨ {lang === 'de' ? 'Fertige Anzeige' : 'Ready Listing'}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(listing);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  background: copied ? '#0f2a0f' : 'transparent',
                  color: '#4caf50',
                  border: '1px solid ' + (copied ? '#1a4a1a' : '#1a3a1a'),
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {copied
                  ? '✓ ' + (lang === 'de' ? 'Kopiert' : 'Copied')
                  : '📋 ' + (lang === 'de' ? 'Kopieren' : 'Copy')}
              </button>
            </div>
            <div
              style={{
                background: '#050a05',
                borderRadius: 10,
                padding: '14px',
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'Syne, sans-serif',
                  marginBottom: 8,
                }}
              >
                {result.listing_title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: '#88aa88',
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {result.listing_description}
              </p>
              <p style={{ fontSize: 12, color: '#558855' }}>
                {result.hashtags}
              </p>
            </div>
          </div>
          {result.tips?.length > 0 && (
            <div
              style={{
                background: '#0a0a0a',
                border: '1px solid #111',
                borderRadius: 14,
                padding: '18px',
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#666',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                💡 Tips
              </p>
              {result.tips.map((tip, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 12, marginBottom: 8 }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#333',
                      fontFamily: 'Syne, sans-serif',
                      minWidth: 20,
                      fontWeight: 700,
                    }}
                  >
                    0{i + 1}
                  </span>
                  <span
                    style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}
                  >
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            <button
              onClick={handleAdd}
              style={{
                background: added ? '#0f2a0f' : '#4caf50',
                color: added ? '#4caf50' : '#000',
                border: added ? '1px solid #1a4a1a' : 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {added
                ? '✓ ' + (lang === 'de' ? 'Im Lager' : 'In Stock')
                : lang === 'de'
                ? '📦 Ins Lager'
                : '📦 Add to Stock'}
            </button>
            <a
              href={`https://www.vinted.de/catalog?search_text=${encodeURIComponent(
                (result.brand || '') + ' ' + (result.product_name || '')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #1a1a1a',
                borderRadius: 10,
                padding: '13px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              🛍️ Vinted
            </a>
          </div>
          <button
            onClick={() => {
              setImage(null);
              setImageData(null);
              setResult(null);
            }}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#444',
              border: 'none',
              padding: '14px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {lang === 'de' ? '↺ Neues Foto scannen' : '↺ Scan new photo'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── LISTING ANALYZER ─────────────────────────────────────────────────────────
function ListingAnalyzer({ lang }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const text = await callClaude(
        [
          {
            role: 'user',
            content: `Analysiere diese Vinted-Anzeige: ${url}\nAntworte NUR als JSON:\n{"score":75,"verdict":"Gut","photo_score":27,"photo_max":30,"title_score":12,"title_max":20,"desc_score":18,"desc_max":25,"details_score":8,"details_max":15,"price_score":10,"price_max":10,"helps":["P1","P2","P3"],"hurts":["P1"],"improvements":["I1","I2"]}`,
          },
        ],
        'Antworte NUR als valides JSON.',
        true
      );
      const match = text.match(/\{[\s\S]*\}/);
      if (match) setResult(JSON.parse(match[0]));
      else
        setError(
          lang === 'de' ? 'Analyse fehlgeschlagen.' : 'Analysis failed.'
        );
    } catch (e) {
      setError('Error: ' + e.message);
    }
    setLoading(false);
  };

  const CircularScore = ({ score }) => {
    const radius = 70,
      circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const color = score >= 70 ? '#4caf50' : score >= 40 ? '#ff8c00' : '#ff3b3b';
    return (
      <div
        style={{
          position: 'relative',
          width: 180,
          height: 180,
          margin: '0 auto',
        }}
      >
        <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="8"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: 10,
              color: '#444',
              letterSpacing: '0.15em',
              marginTop: 6,
            }}
          >
            SCORE
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: 'rgba(76,175,80,0.1)',
            border: '1px solid #1a3a1a',
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: '#4caf50',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          >
            PREMIUM TOOL
          </span>
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          Listing Analyzer
        </h2>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
          {lang === 'de'
            ? 'Vinted Link einfügen → KI bewertet deine Anzeige'
            : 'Paste Vinted URL → AI rates your listing'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && analyze()}
          placeholder="https://www.vinted.de/items/..."
          style={{
            flex: 1,
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: 10,
            padding: '13px 14px',
            fontSize: 13,
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={analyze}
          disabled={loading || !url.trim()}
          style={{
            background: '#4caf50',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            padding: '13px 22px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
            whiteSpace: 'nowrap',
            opacity: url.trim() ? 1 : 0.4,
          }}
        >
          {loading ? '...' : lang === 'de' ? 'Analysieren' : 'Analyze'}
        </button>
      </div>
      {loading && (
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 14,
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              border: '2px solid #1a1a1a',
              borderTop: '2px solid #4caf50',
              borderRadius: '50%',
              margin: '0 auto 14px',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <p style={{ fontSize: 12, color: '#444' }}>
            {lang === 'de' ? 'Anzeige wird analysiert...' : 'Analyzing...'}
          </p>
        </div>
      )}
      {error && (
        <div
          style={{
            background: '#0a0000',
            border: '1px solid #2a0000',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#ff6b6b',
          }}
        >
          {error}
        </div>
      )}
      {result && !loading && (
        <div className="fade-in">
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #111',
              borderRadius: 14,
              padding: '32px 20px',
              textAlign: 'center',
              marginBottom: 14,
            }}
          >
            <CircularScore score={result.score} />
            <h3
              style={{
                marginTop: 20,
                fontSize: 22,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {result.verdict === 'Gut' || result.verdict === 'Good'
                ? lang === 'de'
                  ? 'Gutes Verkaufspotenzial'
                  : 'Good Selling Potential'
                : result.verdict === 'OK'
                ? 'OK Potential'
                : lang === 'de'
                ? 'Niedriges Potenzial'
                : 'Low Potential'}
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              {
                label: lang === 'de' ? 'FOTOS' : 'PHOTOS',
                val: result.photo_score,
                max: result.photo_max,
              },
              {
                label: 'TITEL',
                val: result.title_score,
                max: result.title_max,
              },
              {
                label: lang === 'de' ? 'BESCHREIBUNG' : 'DESCRIPTION',
                val: result.desc_score,
                max: result.desc_max,
              },
              {
                label: 'DETAILS',
                val: result.details_score,
                max: result.details_max,
              },
              {
                label: 'PRICE',
                val: result.price_score,
                max: result.price_max,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid #111',
                  borderRadius: 10,
                  padding: '14px',
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    color: '#444',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fff',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {s.val}
                  <span style={{ color: '#333', fontSize: 13 }}>/{s.max}</span>
                </p>
              </div>
            ))}
          </div>
          {[
            {
              title: lang === 'de' ? 'Was hilft' : 'What helps',
              items: result.helps,
              color: '#4caf50',
            },
            {
              title: lang === 'de' ? 'Was schadet' : 'What hurts',
              items: result.hurts,
              color: '#ff3b3b',
            },
            {
              title: lang === 'de' ? 'Verbesserungen' : 'Improvements',
              items: result.improvements,
              color: '#666',
            },
          ].map(
            (section) =>
              section.items?.length > 0 && (
                <div
                  key={section.title}
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #111',
                    borderRadius: 14,
                    padding: '18px',
                    marginBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    {section.title}
                  </p>
                  {section.items.map((h, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', gap: 10, marginBottom: 8 }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          background: section.color,
                          borderRadius: '50%',
                          marginTop: 8,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}
                      >
                        {h}
                      </span>
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      )}
      {!result && !loading && !error && (
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 14,
            padding: '50px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 10 }}>🔗</p>
          <p style={{ fontSize: 13, color: '#444' }}>
            {lang === 'de' ? 'Vinted Link einfügen' : 'Paste a Vinted URL'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── VENDOR DIRECTORY ─────────────────────────────────────────────────────────
function VendorDirectory({ lang }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Alle');
  const categories = ['Alle', 'Marketplace', 'Sneakers', 'Luxury', 'Wholesale'];
  const filtered = useMemo(
    () =>
      VENDORS.filter(
        (v) =>
          (filter === 'Alle' || v.category === filter) &&
          (!search.trim() ||
            v.name.toLowerCase().includes(search.toLowerCase()) ||
            v.desc.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, filter]
  );
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: 'rgba(76,175,80,0.1)',
            border: '1px solid #1a3a1a',
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: '#4caf50',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          >
            {VENDORS.length}+ VENDORS
          </span>
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          Vendor Directory
        </h2>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
          {lang === 'de'
            ? 'Kuratierte Liste von Marktplätzen und Ressourcen für Reseller.'
            : 'Curated list of marketplaces and resources for resellers.'}
        </p>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={lang === 'de' ? 'Vendor suchen...' : 'Search vendor...'}
        style={{
          width: '100%',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: 10,
          padding: '12px 14px',
          fontSize: 13,
          color: '#fff',
          outline: 'none',
          marginBottom: 12,
        }}
      />
      <div
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              background: filter === cat ? '#4caf50' : 'transparent',
              color: filter === cat ? '#000' : '#444',
              border: filter === cat ? 'none' : '1px solid #1a1a1a',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      {filtered.map((v, i) => (
        <a
          key={i}
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-hover"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 8,
            textDecoration: 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {v.name}
              </p>
              {v.premium && (
                <span
                  style={{
                    background: 'rgba(76,175,80,0.15)',
                    color: '#4caf50',
                    border: '1px solid #1a3a1a',
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  PREMIUM
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
              {v.desc}
            </p>
            <p
              style={{
                fontSize: 10,
                color: '#333',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {v.category}
            </p>
          </div>
          <span style={{ fontSize: 14, color: '#444' }}>↗</span>
        </a>
      ))}
    </div>
  );
}

// ─── TRENDS ───────────────────────────────────────────────────────────────────
function Trends({ lang, onSelect }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          🔥 Trends
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {lang === 'de'
            ? 'Top Artikel auf Vinted aktuell'
            : 'Top items on Vinted right now'}
        </p>
      </div>
      {TREND_ITEMS.map((item, i) => (
        <div
          key={i}
          onClick={() => onSelect(item)}
          className="card-hover"
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 12,
            marginBottom: 8,
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <img
            src={item.img}
            alt={item.name}
            style={{ width: 86, height: 86, objectFit: 'cover', flexShrink: 0 }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div style={{ flex: 1, padding: '14px', minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 10,
                    color: '#444',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}
                >
                  {item.brand}
                </p>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: 'Syne, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {item.name}
                </h3>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: '#222',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                }}
              >
                #{i + 1}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  color: '#4caf50',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                }}
              >
                {item.hype_score}/100
              </span>
              <span style={{ fontSize: 10, color: '#222' }}>·</span>
              <span style={{ fontSize: 11, color: '#888' }}>
                ~{item.avg_price_eur}€
              </span>
              <span style={{ fontSize: 10, color: '#222' }}>·</span>
              <span style={{ fontSize: 11, color: '#666' }}>
                {item.sell_speed}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ITEM MODAL ───────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onAdd, lang }) {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState(String(item.avg_price_eur));
  const [qty, setQty] = useState('1');
  const [added, setAdded] = useState(false);
  const buy = parseFloat(buyPrice) || 0,
    sell = parseFloat(sellPrice) || 0,
    q = parseInt(qty) || 1;
  const profit = (sell - buy) * q;
  const handleAdd = () => {
    if (!buyPrice) return;
    onAdd(item, buyPrice, qty, sellPrice);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };
  const iStyle = {
    width: '100%',
    background: '#080808',
    border: '1px solid #1a1a1a',
    borderRadius: 8,
    padding: '11px 14px',
    fontSize: 13,
    color: '#fff',
    outline: 'none',
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="scale-in"
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#0d0d0d',
          border: '1px solid #1e1e1e',
          borderRadius: 16,
          overflow: 'hidden',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ position: 'relative', height: 200 }}>
          <img
            src={item.img}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.5)',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, #0d0d0d, transparent)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid #2a2a2a',
              color: '#fff',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>
          <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
            <p
              style={{
                fontSize: 11,
                color: '#777',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {item.brand}
            </p>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              {item.name}
            </h2>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div
            style={{
              background: '#080808',
              border: '1px solid #111',
              borderRadius: 10,
              padding: '14px',
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {lang === 'de' ? 'Warum im Trend' : 'Why trending'}
            </p>
            <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
              {item.trend_reason}
            </p>
          </div>
          <div
            style={{
              background: 'rgba(76,175,80,0.04)',
              border: '1px solid #1a3a1a',
              borderRadius: 10,
              padding: '14px',
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: '#4caf50',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              💡 Pro Tip
            </p>
            <p style={{ fontSize: 13, color: '#88aa88', lineHeight: 1.6 }}>
              {item.tip}
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: '#444',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 5,
                }}
              >
                {lang === 'de' ? 'Einkauf' : 'Buy'}
              </p>
              <input
                type="number"
                placeholder="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                style={iStyle}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: '#444',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 5,
                }}
              >
                {lang === 'de' ? 'Verkauf' : 'Sell'}
              </p>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                style={iStyle}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: '#444',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 5,
                }}
              >
                {lang === 'de' ? 'Anzahl' : 'Qty'}
              </p>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={iStyle}
              />
            </div>
          </div>
          {buy > 0 && sell > 0 && (
            <div
              style={{
                background:
                  profit > 0 ? 'rgba(76,175,80,0.06)' : 'rgba(255,59,59,0.06)',
                border: '1px solid ' + (profit > 0 ? '#1a3a1a' : '#3a1a1a'),
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#666',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {lang === 'de' ? 'Gewinn' : 'Profit'}
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: profit > 0 ? '#4caf50' : '#ff6b6b',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {profit >= 0 ? '+' : ''}
                {profit.toFixed(2)}€
              </span>
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={!buyPrice}
            style={{
              width: '100%',
              background: added ? '#0f2a0f' : '#4caf50',
              color: added ? '#4caf50' : '#000',
              border: added ? '1px solid #1a4a1a' : 'none',
              borderRadius: 10,
              padding: '13px',
              fontSize: 13,
              fontWeight: 700,
              cursor: buyPrice ? 'pointer' : 'default',
              fontFamily: 'Syne, sans-serif',
              opacity: buyPrice ? 1 : 0.4,
              marginBottom: 8,
            }}
          >
            {added
              ? '✓ ' + (lang === 'de' ? 'Hinzugefügt' : 'Added')
              : lang === 'de'
              ? '📦 Zum Lager hinzufügen'
              : '📦 Add to Inventory'}
          </button>
          <a
            href={`https://www.vinted.de/catalog?search_text=${encodeURIComponent(
              item.brand + ' ' + item.name
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'transparent',
              color: '#666',
              border: '1px solid #1a1a1a',
              borderRadius: 10,
              padding: '11px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Syne, sans-serif',
            }}
          >
            🛍️ {lang === 'de' ? 'Auf Vinted suchen' : 'Search on Vinted'}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
function AiChat({ lang }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        lang === 'de'
          ? 'Hey. Ich bin dein Vinted-KI-Assistent. Frag mich alles.'
          : "Hey. I'm your Vinted AI assistant.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const history = messages
        .slice(-12)
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text,
        }));
      const reply = await callClaude(
        [...history, { role: 'user', content: msg }],
        `Du bist ResellXIQ – KI-Assistent für Vinted-Reseller. Antworte auf ${
          lang === 'de' ? 'Deutsch' : 'Englisch'
        }, direkt und konkret.`
      );
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Error: ' + e.message },
      ]);
    }
    setLoading(false);
  };
  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 130px)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          💬 KI Chat
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {lang === 'de' ? 'Dein Vinted-Experte' : 'Your Vinted expert'}
        </p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            {m.role === 'assistant' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: '#4caf50',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  flexShrink: 0,
                  alignSelf: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#000',
                    fontWeight: 900,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  X
                </span>
              </div>
            )}
            <div
              style={{
                maxWidth: '80%',
                background: m.role === 'user' ? '#4caf50' : '#0d0d0d',
                border: m.role === 'assistant' ? '1px solid #1a1a1a' : 'none',
                borderRadius:
                  m.role === 'user'
                    ? '14px 14px 4px 14px'
                    : '14px 14px 14px 4px',
                padding: '11px 14px',
                fontSize: 13,
                color: m.role === 'user' ? '#000' : '#bbb',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontWeight: m.role === 'user' ? 500 : 400,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: '#4caf50',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#000',
                  fontWeight: 900,
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                X
              </span>
            </div>
            <div
              style={{
                background: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '14px 14px 14px 4px',
                padding: '11px 14px',
              }}
            >
              <span style={{ fontSize: 12, color: '#444' }}>
                {lang === 'de' ? 'Schreibt...' : 'Typing...'}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={lang === 'de' ? 'Nachricht...' : 'Message...'}
          style={{
            flex: 1,
            background: '#080808',
            border: '1px solid #1a1a1a',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() ? '#4caf50' : '#111',
            color: input.trim() ? '#000' : '#333',
            border: 'none',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: input.trim() ? 'pointer' : 'default',
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── CALCULATOR ───────────────────────────────────────────────────────────────
function Calculator({ lang, onAdd }) {
  const [bp, setBp] = useState(''),
    [sp, setSp] = useState(''),
    [qty, setQty] = useState('1'),
    [sh, setSh] = useState('');
  const [name, setName] = useState(''),
    [brand, setBrand] = useState('');
  const [showAdd, setShowAdd] = useState(false),
    [added, setAdded] = useState(false);
  const buy = parseFloat(bp) || 0,
    sell = parseFloat(sp) || 0,
    q = parseInt(qty) || 1,
    ship = parseFloat(sh) || 0;
  const perItem = sell - buy - ship,
    total = perItem * q;
  const margin = buy > 0 ? ((perItem / buy) * 100).toFixed(0) : null;
  const pc = total > 0 ? '#4caf50' : total < 0 ? '#ff6b6b' : '#666';
  const iStyle = {
    width: '100%',
    background: '#080808',
    border: '1px solid #1a1a1a',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    color: '#fff',
    outline: 'none',
  };
  const handleAdd = () => {
    if (!bp || !sp) return;
    onAdd(
      {
        name: name || 'Produkt',
        brand: brand || '–',
        avg_price_eur: parseFloat(sp),
      },
      bp,
      qty,
      sp
    );
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setShowAdd(false);
      setName('');
      setBrand('');
    }, 2000);
  };
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.03em',
            marginBottom: 6,
          }}
        >
          💰 {lang === 'de' ? 'Gewinnrechner' : 'Profit Calculator'}
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {lang === 'de' ? 'Berechne deinen Gewinn' : 'Calculate your profit'}
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: lang === 'de' ? 'Einkaufspreis €' : 'Buy Price €',
            val: bp,
            set: setBp,
            ph: '25',
          },
          {
            label: lang === 'de' ? 'Verkaufspreis €' : 'Sell Price €',
            val: sp,
            set: setSp,
            ph: '65',
          },
          {
            label: lang === 'de' ? 'Anzahl' : 'Quantity',
            val: qty,
            set: setQty,
            ph: '1',
          },
          {
            label: lang === 'de' ? 'Versand €' : 'Shipping €',
            val: sh,
            set: setSh,
            ph: '0',
          },
        ].map((f) => (
          <div key={f.label}>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {f.label}
            </p>
            <input
              type="number"
              placeholder={f.ph}
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              style={iStyle}
            />
          </div>
        ))}
      </div>
      {buy > 0 && sell > 0 ? (
        <>
          <div
            style={{
              background:
                total > 0 ? 'rgba(76,175,80,0.04)' : 'rgba(255,59,59,0.04)',
              border: '1px solid ' + (total > 0 ? '#1a3a1a' : '#3a1a1a'),
              borderRadius: 14,
              padding: '20px',
              marginBottom: 12,
            }}
          >
            {[
              {
                label: lang === 'de' ? 'Investiert' : 'Invested',
                val: (buy * q).toFixed(2) + '€',
                color: '#666',
              },
              {
                label: lang === 'de' ? 'Gewinn pro Stück' : 'Profit per item',
                val: (perItem >= 0 ? '+' : '') + perItem.toFixed(2) + '€',
                color: pc,
              },
              {
                label: lang === 'de' ? 'Gesamt' : 'Total',
                val: (total >= 0 ? '+' : '') + total.toFixed(2) + '€',
                color: pc,
                big: true,
              },
              ...(margin !== null
                ? [{ label: 'ROI', val: margin + '%', color: pc }]
                : []),
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: '#444',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: s.big ? 28 : 15,
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {s.val}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              width: '100%',
              background: '#4caf50',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: '13px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              marginBottom: showAdd ? 12 : 0,
            }}
          >
            📦 {lang === 'de' ? 'Zum Lager hinzufügen' : 'Add to Inventory'}
          </button>
          {showAdd && (
            <div
              className="fade-in"
              style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: 12,
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 10,
                      color: '#444',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Name
                  </p>
                  <input
                    placeholder={
                      lang === 'de' ? 'z.B. Samba OG' : 'e.g. Samba OG'
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={iStyle}
                  />
                </div>
                <div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 10,
                      color: '#444',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {lang === 'de' ? 'Marke' : 'Brand'}
                  </p>
                  <input
                    placeholder="Adidas"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    style={iStyle}
                  />
                </div>
              </div>
              <button
                onClick={handleAdd}
                style={{
                  width: '100%',
                  background: added ? '#0f2a0f' : '#fff',
                  color: added ? '#4caf50' : '#000',
                  border: added ? '1px solid #1a4a1a' : 'none',
                  borderRadius: 8,
                  padding: '11px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {added
                  ? '✓ ' + (lang === 'de' ? 'Hinzugefügt' : 'Added')
                  : lang === 'de'
                  ? 'Speichern →'
                  : 'Save →'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 14,
            padding: '50px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: '#444' }}>
            {lang === 'de' ? 'Preise eingeben' : 'Enter prices'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
function Inventory({ inventory, onSold, onRemove, onEdit, lang }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.03em',
            marginBottom: 6,
          }}
        >
          📦 {lang === 'de' ? 'Lager' : 'Inventory'}
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {inventory.length} {lang === 'de' ? 'Artikel' : 'items'}
        </p>
      </div>
      {inventory.length === 0 ? (
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 14,
            padding: '50px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: '#444' }}>
            {lang === 'de' ? 'Keine Artikel im Lager' : 'No items in inventory'}
          </p>
        </div>
      ) : (
        inventory.map((item) => {
          const remaining = item.qty - item.sold,
            profit = (item.sellPrice - item.buyPrice) * item.sold;
          return (
            <div
              key={item.id}
              className="fade-in"
              style={{
                background: '#0a0a0a',
                border: '1px solid #111',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {item.img && (
                    <img
                      src={item.img}
                      alt={item.name}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #1a1a1a',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: 10,
                        color: '#444',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.brand}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#fff',
                        fontFamily: 'Syne, sans-serif',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {item.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: '#333' }}>
                      {item.addedAt}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onEdit(item)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #1a1a1a',
                      borderRadius: 6,
                      padding: '5px 10px',
                      color: '#555',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2a2a2a',
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: 4,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {[
                  {
                    label: lang === 'de' ? 'Einkauf' : 'Bought',
                    val: item.buyPrice + '€',
                  },
                  {
                    label: lang === 'de' ? 'Verkauf' : 'Sell',
                    val: item.sellPrice + '€',
                  },
                  {
                    label: lang === 'de' ? 'Gesamt' : 'Total',
                    val: item.qty + 'x',
                  },
                  {
                    label: lang === 'de' ? 'Im Lager' : 'Left',
                    val: remaining + 'x',
                    color: remaining > 0 ? '#888' : '#4caf50',
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: '#050505',
                      border: '1px solid #111',
                      borderRadius: 6,
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: 9,
                        color: '#333',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        color: s.color || '#fff',
                        fontFamily: 'Syne, sans-serif',
                      }}
                    >
                      {s.val}
                    </p>
                  </div>
                ))}
              </div>
              {profit > 0 && (
                <div
                  style={{
                    background: 'rgba(76,175,80,0.05)',
                    border: '1px solid #1a3a1a',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: '#4caf50',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {lang === 'de' ? 'Gewinn' : 'Profit'}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#4caf50',
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    +{profit.toFixed(2)}€
                  </span>
                </div>
              )}
              <button
                onClick={() => onSold(item.id)}
                disabled={remaining === 0}
                style={{
                  width: '100%',
                  background: remaining > 0 ? '#4caf50' : '#0a0a0a',
                  color: remaining > 0 ? '#000' : '#333',
                  border: remaining > 0 ? 'none' : '1px solid #111',
                  borderRadius: 8,
                  padding: '10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: remaining > 0 ? 'pointer' : 'default',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {remaining === 0
                  ? '✓ ' + (lang === 'de' ? 'Alles verkauft' : 'All sold')
                  : lang === 'de'
                  ? '1 verkauft'
                  : 'Mark 1 sold'}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSave, lang }) {
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand);
  const [buyPrice, setBuyPrice] = useState(String(item.buyPrice));
  const [sellPrice, setSellPrice] = useState(String(item.sellPrice));
  const [qty, setQty] = useState(String(item.qty));
  const [img, setImg] = useState(item.img || '');
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImg(ev.target.result);
    reader.readAsDataURL(file);
  };
  const handleSave = () => {
    onSave(item.id, {
      name,
      brand,
      buyPrice: parseFloat(buyPrice) || item.buyPrice,
      sellPrice: parseFloat(sellPrice) || item.sellPrice,
      qty: parseInt(qty) || item.qty,
      img,
    });
    onClose();
  };
  const iStyle = {
    width: '100%',
    background: '#080808',
    border: '1px solid #1a1a1a',
    borderRadius: 8,
    padding: '11px 14px',
    fontSize: 13,
    color: '#fff',
    outline: 'none',
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="scale-in"
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#0d0d0d',
          border: '1px solid #1e1e1e',
          borderRadius: 16,
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {lang === 'de' ? 'Artikel bearbeiten' : 'Edit Item'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              fontSize: 22,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 10,
              color: '#444',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {lang === 'de' ? 'Produktbild' : 'Image'}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {img && (
              <img
                src={img}
                alt=""
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #1a1a1a',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <label
              style={{
                flex: 1,
                background: '#080808',
                border: '1px dashed #2a2a2a',
                borderRadius: 8,
                padding: '14px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'block',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
              <p style={{ margin: 0, fontSize: 12, color: '#555' }}>
                📷 {lang === 'de' ? 'Bild hochladen' : 'Upload image'}
              </p>
            </label>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {[
            { label: 'Name', val: name, set: setName, ph: 'Samba OG' },
            {
              label: lang === 'de' ? 'Marke' : 'Brand',
              val: brand,
              set: setBrand,
              ph: 'Adidas',
            },
            {
              label: lang === 'de' ? 'Einkauf €' : 'Buy €',
              val: buyPrice,
              set: setBuyPrice,
              ph: '25',
              type: 'number',
            },
            {
              label: lang === 'de' ? 'Verkauf €' : 'Sell €',
              val: sellPrice,
              set: setSellPrice,
              ph: '65',
              type: 'number',
            },
            {
              label: lang === 'de' ? 'Anzahl' : 'Qty',
              val: qty,
              set: setQty,
              ph: '1',
              type: 'number',
            },
          ].map((f) => (
            <div key={f.label}>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  color: '#444',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {f.label}
              </p>
              <input
                type={f.type || 'text'}
                placeholder={f.ph}
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                style={iStyle}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            background: '#4caf50',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            padding: '13px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          {lang === 'de' ? 'Speichern ✓' : 'Save ✓'}
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ inventory, stats, lang }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.03em',
            marginBottom: 6,
          }}
        >
          📊 Dashboard
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {lang === 'de' ? 'Deine Performance' : 'Your performance'}
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: lang === 'de' ? 'Investiert' : 'Invested',
            val: stats.invested.toFixed(2) + '€',
            color: '#666',
          },
          {
            label: lang === 'de' ? 'Umsatz' : 'Revenue',
            val: stats.revenue.toFixed(2) + '€',
            color: '#fff',
          },
          {
            label: lang === 'de' ? 'Gewinn' : 'Profit',
            val: '+' + stats.profit.toFixed(2) + '€',
            color: stats.profit > 0 ? '#4caf50' : '#ff6b6b',
          },
          {
            label: lang === 'de' ? 'Im Lager' : 'In Stock',
            val: stats.unsold + '',
            color: '#888',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card-hover"
            style={{
              background: '#0a0a0a',
              border: '1px solid #111',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 10,
                color: '#444',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: s.color,
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '-0.03em',
              }}
            >
              {s.val}
            </p>
          </div>
        ))}
      </div>
      {inventory.length > 0 && (
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 12,
            padding: '20px',
          }}
        >
          <p
            style={{
              margin: '0 0 14px',
              fontSize: 11,
              color: '#666',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            🏆 Top {lang === 'de' ? 'Artikel' : 'Items'}
          </p>
          {[...inventory]
            .sort(
              (a, b) =>
                (b.sellPrice - b.buyPrice) * b.sold -
                (a.sellPrice - a.buyPrice) * a.sold
            )
            .slice(0, 5)
            .map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < 4 ? '1px solid #111' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#222',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      minWidth: 18,
                    }}
                  >
                    0{i + 1}
                  </span>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fff',
                        fontFamily: 'Syne, sans-serif',
                      }}
                    >
                      {item.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: '#444' }}>
                      {item.sold}/{item.qty}{' '}
                      {lang === 'de' ? 'verkauft' : 'sold'}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#4caf50',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  +{((item.sellPrice - item.buyPrice) * item.sold).toFixed(2)}€
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── IMPRESSUM ────────────────────────────────────────────────────────────────
function Impressum({ lang, onBack }) {
  return (
    <div className="fade-in">
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: '1px solid #1a1a1a',
          borderRadius: 8,
          padding: '7px 14px',
          color: '#888',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          marginBottom: 20,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#4caf50';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1a1a1a';
          e.currentTarget.style.color = '#888';
        }}
      >
        ← {lang === 'de' ? 'Zurück' : 'Back'}
      </button>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          Impressum
        </h2>
        <p style={{ fontSize: 13, color: '#666' }}>
          {lang === 'de' ? 'Angaben gemäß § 5 TMG' : 'Legal Notice'}
        </p>
      </div>

      {[
        {
          title: lang === 'de' ? 'Betreiber' : 'Operator',
          content: [
            'ResellXIQ',
            'Erstellt von Deniz Coban & Miran Simsek',
            'Köln, Deutschland',
          ],
        },
        {
          title: 'Kontakt',
          content: ['E-Mail: miransimsek42@gmail.com'],
        },
        {
          title: lang === 'de' ? 'Haftungsausschluss' : 'Disclaimer',
          content: [
            lang === 'de'
              ? 'Die Inhalte dieser App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir keine Gewähr übernehmen. Die KI-generierten Preiseinschätzungen und Marktanalysen sind unverbindliche Empfehlungen und stellen keine Kaufberatung dar.'
              : 'The content of this app has been created with the utmost care. However, we cannot guarantee the accuracy, completeness or timeliness of the content. AI-generated price estimates and market analyses are non-binding recommendations and do not constitute investment advice.',
          ],
        },
        {
          title: lang === 'de' ? 'Urheberrecht' : 'Copyright',
          content: [
            lang === 'de'
              ? 'Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung der Autoren.'
              : 'The content and works created by the site operators are subject to German copyright law. Reproduction, editing and distribution outside the limits of copyright law require the written consent of the authors.',
          ],
        },
        {
          title: lang === 'de' ? 'Datenschutz' : 'Privacy',
          content: [
            lang === 'de'
              ? 'Diese App speichert keine personenbezogenen Daten ohne deine Zustimmung. Bei der Nutzung des Login-Systems werden E-Mail-Adresse und verschlüsseltes Passwort bei Supabase (EU-Server, Frankfurt) gespeichert.'
              : 'This app does not store personal data without your consent. When using the login system, email address and encrypted password are stored at Supabase (EU server, Frankfurt).',
          ],
        },
      ].map((section, i) => (
        <div
          key={i}
          style={{
            background: '#0a0a0a',
            border: '1px solid #111',
            borderRadius: 14,
            padding: '20px',
            marginBottom: 12,
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 11,
              color: '#4caf50',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {section.title}
          </p>
          {section.content.map((line, j) => (
            <p
              key={j}
              style={{
                margin: j < section.content.length - 1 ? '0 0 6px' : 0,
                fontSize: 13,
                color: '#aaa',
                lineHeight: 1.7,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {line.includes('@') ? (
                <a
                  href={`mailto:${line.split(': ')[1]}`}
                  style={{ color: '#4caf50', textDecoration: 'none' }}
                >
                  {line}
                </a>
              ) : (
                line
              )}
            </p>
          ))}
        </div>
      ))}

      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid #111',
          borderRadius: 14,
          padding: '16px',
          textAlign: 'center',
          marginTop: 20,
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: '#333',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          © 2025 ResellXIQ · Deniz Coban & Miran Simsek · Köln
        </p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ResellXIQ() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('resellxiq_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showLogin, setShowLogin] = useState(false);
  const [lang, setLang] = useState('de');
  const [page, setPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [inventory, setInventory] = useState([]);
  const t = T[lang];

  const handleLogin = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('resellxiq_user', JSON.stringify(userData));
    } catch {}
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('resellxiq_user');
    } catch {}
  };

  const addToInventory = (item, buyPrice, qty, sellPrice) => {
    setInventory((prev) => [
      {
        id: Date.now(),
        name: item.name,
        brand: item.brand,
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice) || item.avg_price_eur,
        qty: parseInt(qty),
        sold: 0,
        addedAt: new Date().toLocaleDateString('de-DE'),
        img: item.img,
      },
      ...prev,
    ]);
  };
  const markSold = (id) =>
    setInventory((prev) =>
      prev.map((i) =>
        i.id === id && i.sold < i.qty ? { ...i, sold: i.sold + 1 } : i
      )
    );
  const removeItem = (id) =>
    setInventory((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id, updates) =>
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );

  const stats = useMemo(
    () => ({
      invested: inventory.reduce((s, i) => s + i.buyPrice * i.qty, 0),
      revenue: inventory.reduce((s, i) => s + i.sellPrice * i.sold, 0),
      profit: inventory.reduce(
        (s, i) => s + (i.sellPrice - i.buyPrice) * i.sold,
        0
      ),
      unsold: inventory.reduce((s, i) => s + (i.qty - i.sold), 0),
    }),
    [inventory]
  );

  const NAV_ITEMS = [
    { id: 'home', label: t.nav.home, icon: '🏠' },
    { id: 'scan', label: t.nav.scan, icon: '📸' },
    { id: 'analyzer', label: t.nav.analyzer, icon: '🔍' },
    { id: 'trends', label: t.nav.trends, icon: '🔥' },
    { id: 'chat', label: t.nav.chat, icon: '💬' },
    { id: 'calc', label: t.nav.calc, icon: '💰' },
    { id: 'inventory', label: t.nav.inventory, icon: '📦' },
    { id: 'vendors', label: t.nav.vendors, icon: '🏷️' },
    { id: 'dashboard', label: t.nav.dashboard, icon: '📊' },
    { id: 'impressum', label: 'Impressum', icon: '📄' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', width: '100%' }}>
      <style>{ROOT_CSS}</style>

      {/* TOP NAVBAR */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: 'rgba(5,5,5,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #111',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'transparent',
            border: '1px solid #1a1a1a',
            borderRadius: 8,
            padding: '6px 10px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4caf50')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}
        >
          <span style={{ fontSize: 14 }}>☰</span>
        </button>
        <div
          onClick={() => setPage('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            flex: 1,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              background: '#4caf50',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: '#000',
                fontWeight: 900,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              X
            </span>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            ResellXIQ
          </span>
        </div>

        {/* Language Toggle */}
        <div
          style={{
            display: 'flex',
            background: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {['de', 'en'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                background: lang === l ? '#4caf50' : 'transparent',
                color: lang === l ? '#000' : '#444',
                border: 'none',
                padding: '5px 10px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Login Button */}
        {user ? (
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #1a3a1a',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#4caf50',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {user.email?.split('@')[0]} ↓
          </button>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            style={{
              background: '#4caf50',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              color: '#000',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {t.login}
          </button>
        )}
      </header>

      {/* SIDEBAR */}
      <aside
        style={{
          position: 'fixed',
          top: 56,
          left: sidebarOpen ? 0 : -260,
          width: 260,
          height: 'calc(100vh - 56px)',
          background: '#080808',
          borderRight: '1px solid #111',
          padding: '20px 14px',
          overflowY: 'auto',
          zIndex: 150,
          transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <p
          style={{
            margin: '0 0 14px 4px',
            fontSize: 9,
            color: '#333',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Navigation
        </p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setPage(item.id);
              setSidebarOpen(false);
            }}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: page === item.id ? '#4caf50' : 'transparent',
              color: page === item.id ? '#000' : '#666',
              border:
                page === item.id
                  ? '1px solid #4caf50'
                  : '1px solid transparent',
              borderRadius: 8,
              padding: '11px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              marginBottom: 4,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div
          style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #111' }}
        >
          {user ? (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(76,175,80,0.05)',
                border: '1px solid #1a3a1a',
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  margin: '0 0 2px',
                  fontSize: 10,
                  color: '#4caf50',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                ✓ Eingeloggt
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: '#666' }}>
                {user.email}
              </p>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #1a1a1a',
                  borderRadius: 6,
                  padding: '5px 10px',
                  color: '#555',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                }}
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowLogin(true);
                setSidebarOpen(false);
              }}
              style={{
                width: '100%',
                background: '#4caf50',
                border: 'none',
                borderRadius: 8,
                padding: '11px',
                color: '#000',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {t.login} / {t.register}
            </button>
          )}
        </div>
      </aside>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: 56,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 140,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* MAIN CONTENT */}
      <main style={{ paddingTop: 56, minHeight: '100vh' }}>
        {page === 'home' ? (
          <LandingPage lang={lang} onStart={setPage} />
        ) : (
          <div
            style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}
          >
            {page === 'scan' && (
              <PhotoScan lang={lang} onAddInventory={addToInventory} />
            )}
            {page === 'analyzer' && <ListingAnalyzer lang={lang} />}
            {page === 'trends' && (
              <Trends lang={lang} onSelect={setSelectedItem} />
            )}
            {page === 'chat' && <AiChat lang={lang} />}
            {page === 'calc' && (
              <Calculator lang={lang} onAdd={addToInventory} />
            )}
            {page === 'inventory' && (
              <Inventory
                inventory={inventory}
                onSold={markSold}
                onRemove={removeItem}
                onEdit={setEditingItem}
                lang={lang}
              />
            )}
            {page === 'vendors' && <VendorDirectory lang={lang} />}
            {page === 'dashboard' && (
              <Dashboard inventory={inventory} stats={stats} lang={lang} />
            )}
            {page === 'impressum' && (
              <Impressum lang={lang} onBack={() => setPage('home')} />
            )}
          </div>
        )}
      </main>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          lang={lang}
        />
      )}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={addToInventory}
          lang={lang}
        />
      )}
      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={updateItem}
          lang={lang}
        />
      )}
    </div>
  );
}
