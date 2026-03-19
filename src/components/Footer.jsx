// ─────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext'; 


function Footer() {
  const { lang } = useLang();
  return (
    <footer className="site-footer">
      <div className="footer-brand">THE IDALA FAMILY — The Mindful Links</div>
      <div className="footer-copy">
        {lang==='fr' ? '© 2026 Diane Thomas. Tous droits réservés.' : '© 2026 Diane Thomas. All rights reserved.'}
      </div>
    </footer>
  );
}

export default Footer;