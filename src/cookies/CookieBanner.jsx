import { useLocation } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { useCookieConsent } from './CookieConsentProvider';
import './CookieBanner.css';

// Prefixes de routes ou la banniere ne doit PAS s'afficher (admin, etc.).
const HIDDEN_PREFIXES = ['/admin'];

// Textes du bandeau, selon la langue du site.
const COPY = {
  fr: {
    title: 'Cookies',
    text: <>Idala utilise des cookies de mesure d'audience publicitaire pour comprendre ce qui vous amène ici. Vous pouvez les accepter ou les refuser, puis modifier votre choix à tout moment. <br/> Refuser n'enlève rien à votre expérience sur le site.</>,
    refuse: 'Refuser',
    accept: 'Accepter',
  },
  en: {
    title: 'Cookies',
    text: <>Idala uses advertising analytics cookies to understand what brings you here. You can accept or decline them, and change your mind at any time. <br/>Declining takes nothing away from your experience on the site.</>,
    refuse: 'Decline',
    accept: 'Accept',
  },
};

export default function CookieBanner() {
  const { consent, ready, acceptCookies, refuseCookies } = useCookieConsent();
  const { lang } = useLang();
  const location = useLocation();

  const onHiddenRoute = HIDDEN_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  // On n'affiche rien : sur une route masquee, tant qu'on n'a pas lu le
  // choix stocke, ou si l'utilisateur a deja tranche.
  if (onHiddenRoute || !ready || consent !== null) return null;

  const t = COPY[lang] || COPY.fr;

  return (
    <aside
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
    >
      <span className="cookie-banner__chakra" aria-hidden="true" />
      <div className="cookie-banner__content">
        <h2 id="cookie-banner-title" className="cookie-banner__title">
          {t.title}
        </h2>
        <p id="cookie-banner-text" className="cookie-banner__text">
          {t.text}
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--refuse"
            onClick={refuseCookies}
          >
            {t.refuse}
          </button>
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--accept"
            onClick={acceptCookies}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </aside>
  );
}