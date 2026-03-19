// ─────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLang } from '../components/LangContext';  // ← seul changement


const NAV = [
  { path: '/',              en: 'Home',               fr: 'Accueil'              },
  { path: '/practitioners', en: 'Practitioners',      fr: 'Praticiens'           },
  { path: '/spiritual',     en: 'Spiritual Guidance', fr: 'Guidance Spirituelle' },
  { path: '/astrology',     en: 'Birth Chart',        fr: 'Thème Astral'         },
  { path: '/about',         en: 'About',              fr: 'À propos'             },
];

function TopBar() {
  const { lang, setLang } = useLang();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const go = (path) => { navigate(path); setOpen(false); };

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand" onClick={() => go('/')} style={{cursor: 'pointer'}}>
           THE IDALA FAMILY
        </div>
        <nav className="topbar__nav">
          {NAV.map(item => (
            <button key={item.path}
              className={`topbar__nav-link${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => go(item.path)}>
              {lang === 'fr' ? item.fr : item.en}
            </button>
          ))}
          <div className="lang-toggle">
            <button className={`lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
            <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={()=>setLang('fr')}>FR</button>
          </div>
        </nav>
        <button className={`hamburger${open?' open':''}`} onClick={()=>setOpen(o=>!o)} aria-label="Menu">
          <span className="hamburger__line"/><span className="hamburger__line"/><span className="hamburger__line"/>
        </button>
      </header>

      {open && (
        <nav className="mobile-drawer">
          {NAV.map(item => (
            <button key={item.path}
              className={`mobile-drawer__link${location.pathname===item.path?' active':''}`}
              onClick={()=>go(item.path)}>
              {lang==='fr'?item.fr:item.en}
            </button>
          ))}
          <div className="mobile-drawer__lang">
            <button className={`lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
            <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={()=>setLang('fr')}>FR</button>
          </div>
        </nav>
      )}
    </>
  );
}

export default TopBar;