import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { useCookieConsent } from './CookieConsentProvider';
import './CookieBanner.css';

// Prefixes de routes ou la banniere ne doit PAS s'afficher (admin, etc.).
const HIDDEN_PREFIXES = ['/admin'];

// Delai avant l'apparition du bandeau, le temps que le loader d'accueil
// se termine. Ajuste-le a la duree de ton loader (en millisecondes).
const ENTRANCE_DELAY_MS = 3000;

// Textes du bandeau, selon la langue du site.
const COPY = {
  fr: {
    title: 'Cookies',
    text: "Idala utilise des cookies de mesure d'audience publicitaire pour comprendre ce qui vous amène ici. Vous pouvez les accepter ou les refuser, puis modifier votre choix à tout moment. Refuser n'enlève rien à votre expérience sur le site.",
    refuse: 'Refuser',
    accept: 'Accepter',
  },
  en: {
    title: 'Cookies',
    text: 'Idala uses advertising analytics cookies to understand what brings you here. You can accept or decline them, and change your mind at any time. Declining takes nothing away from your experience on the site.',
    refuse: 'Decline',
    accept: 'Accept',
  },
};

export default function CookieBanner() {
  const { consent, ready, acceptCookies, refuseCookies } = useCookieConsent();
  const { lang } = useLang();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  const onHiddenRoute = HIDDEN_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  // Doit-on afficher la banniere du tout ?
  const shouldRender = ready && consent === null && !onHiddenRoute;

  // On declenche l'entree (glisse depuis le bas) apres le delai du loader.
  useEffect(() => {
    if (!shouldRender) return undefined;
    const id = setTimeout(() => setVisible(true), ENTRANCE_DELAY_MS);
    return () => clearTimeout(id);
  }, [shouldRender]);

  if (!shouldRender) return null;

  const t = COPY[lang] || COPY.fr;

  return (
    <aside
      className={`cookie-banner${visible ? ' is-visible' : ''}`}
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