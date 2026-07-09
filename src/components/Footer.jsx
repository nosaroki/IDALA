// ─────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext';
import { useNavigate } from 'react-router-dom';

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

function Footer() {
  const { lang }   = useLang();
  const navigate   = useNavigate();

  return (
    <footer className="site-footer">

      {/* Haut : marque + instagram */}
      <div className="footer-top">
        <div className="footer-brand">THE IDALA FAMILY</div>
        <a href="https://www.instagram.com/the.idala.family/"
          target="_blank"
          rel="noreferrer"
          className="footer-instagram"
          aria-label="Instagram"
        >
          <span className="footer-instagram__label">
            {lang === 'fr' ? 'Suivez-nous' : 'Follow us'}
          </span>
          <InstagramIcon />
        </a>
      </div>

      {/* Milieu : liens de navigation */}
      <nav className="footer-nav" aria-label={lang === 'fr' ? 'Liens de bas de page' : 'Footer links'}>
        <button onClick={() => navigate('/join')} className="footer-link">
          {lang === 'fr' ? 'Devenir praticien' : 'Become a practitioner'}
        </button>
        <span className="footer-sep">·</span>
        <button onClick={() => navigate('/cgu')} className="footer-link">
          {lang === 'fr' ? 'Conditions générales' : 'Terms of use'}
        </button>
        <span className="footer-sep">·</span>
        <a href="mailto:contact@theidalafamily.com" className="footer-link">
          Contact
        </a>
      </nav>

      {/* Bas : copyright */}
      <div className="footer-bottom">
        <div className="footer-copy">
          {lang === 'fr' ? (
            <>© {new Date().getFullYear()} The Idala Family · Développé par <a href="https://nod-consulting.com/" target="_blank" rel="noreferrer" className="footer-nod">NOD Consulting</a></>
          ) : (
            <>© {new Date().getFullYear()} The Idala Family · Developed by <a href="https://nod-consulting.com/" target="_blank" rel="noreferrer" className="footer-nod">NOD Consulting</a></>
          )}
        </div>
      </div>

    </footer>
  );
}

export default Footer;