import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLang } from '../components/LangContext';
import trsprlogo from '../assets/trsprlogo.png';

const SERVICES = [
  { path: '/practitioners', en: 'Practitioners', fr: 'Praticiens' },
  { path: '/retreats',      en: 'Retreats',      fr: 'Retraites'  },
  { path: '/corporate',     en: 'Corporate',     fr: 'Entreprises' },
  { path: '/spiritual',     en: 'Guidance',      fr: 'Guidance'   },
]

const NAV = [
  { path: '/astrology', en: 'Birth Chart', fr: 'Thème Astral' },
  { path: '/about',     en: 'About',       fr: 'À propos'     },
]

function TopBar() {
  const { lang, setLang } = useLang()
  const navigate          = useNavigate()
  const location          = useLocation()
  const [open, setOpen]   = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const go = (path) => { navigate(path); setOpen(false); setDropOpen(false) }

  const isServiceActive = SERVICES.some(s => location.pathname === s.path)

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand" onClick={() => go('/')} style={{ cursor: 'pointer' }}>
          <img src={trsprlogo} alt="Idala logo" className="topbar__logo" />
          THE IDALA FAMILY
        </div>

        <nav className="topbar__nav">

          {/* Dropdown Nos Offres */}
          <div
            className="topbar__dropdown"
            onMouseEnter={() => setDropOpen(true)}
            onMouseLeave={() => setDropOpen(false)}
          >
            <button className={`topbar__nav-link${isServiceActive ? ' active' : ''}`}>
              {lang === 'fr' ? 'Nos Offres' : 'Our Services'} ▾
            </button>
            {dropOpen && (
              <div className="topbar__dropdown-menu">
                {SERVICES.map(item => (
                  <button
                    key={item.path}
                    className={`topbar__dropdown-item${location.pathname === item.path ? ' active' : ''}`}
                    onClick={() => go(item.path)}
                  >
                    {lang === 'fr' ? item.fr : item.en}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liens directs */}
          {NAV.map(item => (
            <button key={item.path}
              className={`topbar__nav-link${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => go(item.path)}>
              {lang === 'fr' ? item.fr : item.en}
            </button>
          ))}

          {/* Bouton Devenir praticien */}
          <button
            className="topbar__join-btn"
            onClick={() => go('/join')}
          >
            {lang === 'fr' ? 'Devenir praticien' : 'Become a practitioner'}
          </button>

          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </nav>

        <button className={`hamburger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span className="hamburger__line" /><span className="hamburger__line" /><span className="hamburger__line" />
        </button>
      </header>

      {/* Menu mobile */}
      {open && (
        <nav className="mobile-drawer">
          <p className="mobile-drawer__section">{lang === 'fr' ? 'Services' : 'Services'}</p>
          {SERVICES.map(item => (
            <button key={item.path}
              className={`mobile-drawer__link${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => go(item.path)}>
              {lang === 'fr' ? item.fr : item.en}
            </button>
          ))}
          {NAV.map(item => (
            <button key={item.path}
              className={`mobile-drawer__link${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => go(item.path)}>
              {lang === 'fr' ? item.fr : item.en}
            </button>
          ))}
          <button className="topbar__join-btn" style={{ margin: '0.5rem 1.5rem' }} onClick={() => go('/join')}>
            {lang === 'fr' ? 'Devenir praticien' : 'Become a practitioner'}
          </button>
          <div className="mobile-drawer__lang">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>FR</button>
          </div>
        </nav>
      )}
    </>
  )
}

export default TopBar