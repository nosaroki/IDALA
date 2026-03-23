// ─────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext';

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

function Footer() {
  const { lang } = useLang();
  return (
    <footer className="site-footer">

      {/* Ligne 1 — brand gauche, instagram droite */}
      <div className="footer-top">
        <div className="footer-brand">THE IDALA FAMILY</div>
        
      </div>

      {/* Ligne 2 — copyright centré ou à droite */}
      <div className="footer-bottom">

          <a href="https://www.instagram.com/the.idala.family/"
          target="_blank"
          rel="noreferrer"
          className="footer-instagram"
          aria-label="Instagram — The Idala Family"
        >
          <span className="footer-instagram__label">
            {lang === 'fr' ? 'Suivez-nous sur Instagram' : 'Follow us on Instagram'}
          </span>
          <InstagramIcon />
        </a>
      </div>

        <div className="footer-copy">
          {lang === 'fr' ? (
            <>
              © Tous droits réservés. Développé par <a href="https://nod-consulting.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>NOD Consulting</a>
            </>
          ) : (
            <>
              © All rights reserved. Developed by <a href="https://nod-consulting.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>NOD Consulting</a>
            </>
          )}
        </div>

    </footer>
  );
}

export default Footer;