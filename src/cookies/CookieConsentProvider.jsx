import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { loadPixel, trackPageView } from './metaPixel';

// Cle de stockage du choix de l'utilisateur.
const STORAGE_KEY = 'idala_cookie_consent';

const CookieConsentContext = createContext(null);

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      'useCookieConsent doit etre utilise dans <CookieConsentProvider>'
    );
  }
  return ctx;
}

export function CookieConsentProvider({ children }) {
  // 'granted' | 'refused' | null (pas encore choisi)
  const [consent, setConsent] = useState(null);
  const [ready, setReady] = useState(false);
  const location = useLocation();

  // Au montage : on lit le choix deja enregistre.
  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      stored = null;
    }
    if (stored === 'granted') {
      setConsent('granted');
      loadPixel();
      trackPageView(); // premier PageView du visiteur deja consentant
    } else if (stored === 'refused') {
      setConsent('refused');
    }
    setReady(true);
  }, []);

  // A chaque changement de route : PageView, uniquement si consentement accorde.
  // Le premier PageView est deja gere ci-dessus (au montage) ou dans accept().
  useEffect(() => {
    if (consent === 'granted') {
      trackPageView();
    }
    // On ne depend volontairement que du chemin : on veut declencher
    // sur navigation, pas sur changement d'etat du consentement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const acceptCookies = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'granted');
    } catch (e) {}
    setConsent('granted');
    loadPixel();
    trackPageView();
  }, []);

  const refuseCookies = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'refused');
    } catch (e) {}
    setConsent('refused');
    // Aucun script Meta n'a ete charge : rien a nettoyer.
  }, []);

  // Rouvre la banniere (ex. lien "Gerer les cookies" en pied de page).
  const reopenBanner = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setConsent(null);
  }, []);

  const value = {
    consent,
    ready,
    acceptCookies,
    refuseCookies,
    reopenBanner,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}