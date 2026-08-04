// metaPixel.js
// Chargement et suivi du Pixel Meta, conditionnes au consentement.
// Le script Meta n'est JAMAIS injecte tant que l'utilisateur n'a pas accepte.
// C'est ce point qui rend l'integration conforme CNIL : aucun cookie de
// tracking n'est depose avant le consentement explicite.

export const PIXEL_ID = '1054931427036403';

let pixelLoaded = false;

// Injecte le script officiel fbevents.js et initialise le Pixel.
// Appele uniquement apres acceptation.
export function loadPixel() {
  if (pixelLoaded || typeof window === 'undefined') return;
  if (window.fbq) {
    pixelLoaded = true;
    return;
  }

  // Snippet de base Meta (version fonction).
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  window.fbq('init', PIXEL_ID);
  pixelLoaded = true;
}

// Envoie un evenement PageView.
// Sans effet si le Pixel n'est pas charge (donc sans effet sans consentement).
export function trackPageView() {
  if (!pixelLoaded || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

export function isPixelLoaded() {
  return pixelLoaded;
}