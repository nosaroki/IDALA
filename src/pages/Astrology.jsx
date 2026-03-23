// ─────────────────────────────────────────
//  ASTROLOGY v2
// ─────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';

// ─── SVG Zodiac Sign Icons ───────────────
const ZodiacIcons = {
  Aries:       '♈\uFE0E',
  Taurus:      '♉\uFE0E',
  Gemini:      '♊\uFE0E',
  Cancer:      '♋\uFE0E',
  Leo:         '♌\uFE0E',
  Virgo:       '♍\uFE0E',
  Libra:       '♎\uFE0E',
  Scorpio:     '♏\uFE0E',
  Sagittarius: '♐\uFE0E',
  Capricorn:   '♑\uFE0E',
  Aquarius:    '♒\uFE0E',
  Pisces:      '♓\uFE0E',
};

// ─── Planet SVG Icons ────────────────────
const PlanetIcons = {
  Sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2 L12 5M12 19 L12 22M2 12 L5 12M19 12 L22 12M4.9 4.9 L7.1 7.1M16.9 16.9 L19.1 19.1M19.1 4.9 L16.9 7.1M7.1 16.9 L4.9 19.1"/></svg>,
  Moon:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M21 12.8 A9 9 0 1 1 11.2 3 A7 7 0 0 0 21 12.8Z"/></svg>,
  Rising:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3 Q16 7 12 12 Q8 7 12 3Z" fill="currentColor" opacity=".2"/></svg>,
  Mercury: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="11" r="5"/><path d="M8 6 Q8 2 12 2 Q16 2 16 6"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Venus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="19" x2="15" y2="19"/></svg>,
  Mars:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="10" cy="14" r="6"/><line x1="14.5" y1="9.5" x2="21" y2="3"/><polyline points="16,3 21,3 21,8"/></svg>,
  Jupiter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M10 4 L10 20M6 12 L14 12"/><path d="M14 8 Q18 8 18 12 Q18 16 14 16 Q11 16 10 14"/></svg>,
  Saturn:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M10 4 L10 20M6 12 L14 12"/><path d="M14 12 Q18 12 18 16 Q18 20 14 20 Q11 20 10 18"/><path d="M6 4 Q10 4 14 6"/></svg>,
};

// ─── Astronomical Functions ──────────────
const D2R = Math.PI / 180;
const mod360 = x => ((x % 360) + 360) % 360;
const toJD = (y, m, d, h = 12) => {
  let Y = y, M = m;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + h / 24 + B - 1524.5;
};
const sunLon = jd => {
  const n = jd - 2451545, L = mod360(280.460 + 0.9856474 * n), g = mod360(357.528 + 0.9856003 * n) * D2R;
  return mod360(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
};
const moonLon = jd => {
  const T = (jd - 2451545) / 36525,
        Lp = mod360(218.3164477 + 481267.88123421 * T),
        D  = mod360(297.8501921 + 445267.1114034 * T),
        M  = mod360(357.5291092 + 35999.0502909 * T),
        Mp = mod360(134.9633964 + 477198.8675055 * T),
        F  = mod360(93.2720950  + 483202.0175233 * T);
  return mod360(
    Lp + 6.288774 * Math.sin(Mp * D2R) + 1.274027 * Math.sin((2*D - Mp) * D2R)
    + 0.658314 * Math.sin(2*D * D2R)   + 0.213618 * Math.sin(2*Mp * D2R)
    - 0.185116 * Math.sin(M * D2R)     - 0.114332 * Math.sin(2*F * D2R)
    + 0.058793 * Math.sin((2*D - 2*Mp) * D2R)
    + 0.057066 * Math.sin((2*D - M - Mp) * D2R)
    + 0.053322 * Math.sin((2*D + Mp) * D2R)
    + 0.045758 * Math.sin((2*D - M) * D2R)
    - 0.040923 * Math.sin((M - Mp) * D2R)
    - 0.034720 * Math.sin(D * D2R)
    - 0.030383 * Math.sin((M + Mp) * D2R)
  );
};
const PP = {
  Mercury: [252.250324, 4.092338427], Venus:   [181.979801, 1.602130476],
  Mars:    [355.433275, 0.524071084], Jupiter: [34.351519,  0.083086762],
  Saturn:  [50.077444,  0.033459928]
};
const pLon = (name, jd) => { const d = jd - 2451545, [L0, r] = PP[name]; return mod360(L0 + r * d); };
const calcAsc = (jd, lat, lon) => {
  const T = (jd - 2451545) / 36525;
  
  // Temps sidéral de Greenwich en degrés
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
  GMST = mod360(GMST);
  
  // Temps sidéral local
  const LST = mod360(GMST + lon);
  
  // Obliquité de l'écliptique
  const eps = (23.439292 - 0.013004 * T) * D2R;
  
  const LSTr = LST * D2R;
  const latr = lat * D2R;
  
  // Ascendant via la formule de Meeus
  const ascRad = Math.atan2(
    Math.cos(LSTr),
    -(Math.sin(LSTr) * Math.cos(eps) + Math.tan(latr) * Math.sin(eps))
  );
  
  return mod360(ascRad * (180 / Math.PI));
};
const geocode = async place => {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
    const d = await r.json();
    if (d.length) return { lat: +d[0].lat, lon: +d[0].lon, display: d[0].display_name.split(',').slice(0, 2).join(',') };
  } catch { /* empty */ }
  return null;
};
const S_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const S_FR = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];
const S_GL = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const signFrom = lon => {
  const i = Math.floor(mod360(lon) / 30), deg = Math.floor(mod360(lon) % 30), min = Math.floor((mod360(lon) % 1) * 60);
  return { en: S_EN[i], fr: S_FR[i], g: S_GL[i], deg: `${deg}° ${min}'`, icon: ZodiacIcons[S_EN[i]] };
};

// ─── Benefits ────────────────────────────
const BENEFITS = [
  { en: 'Self-Awareness',       fr: 'Connaissance de Soi',       chakra: 'c3',
    de: 'Gain clearer insight into your personality, motivations, and natural tendencies.',
    df: 'Obtenez une vision plus claire de votre personnalité, de vos motivations et de vos tendances naturelles.' },
  { en: 'Emotional Insight',    fr: 'Perspicacité Émotionnelle',  chakra: 'c4',
    de: 'Understand how you process emotions and respond to stress, change, and relationships.',
    df: 'Comprenez comment vous traitez les émotions et répondez au stress, au changement et aux relations.' },
  { en: 'Relationship Clarity', fr: 'Clarté Relationnelle',       chakra: 'c5',
    de: 'Explore compatibility patterns and communication dynamics with others.',
    df: 'Explorez les schémas de compatibilité et les dynamiques de communication avec les autres.' },
  { en: 'Direction & Strengths',fr: 'Direction & Forces',         chakra: 'c6',
    de: 'Recognize your talents, ambitions, and areas for growth and development.',
    df: 'Reconnaissez vos talents, vos ambitions et vos domaines de croissance et de développement.' },
  { en: 'Life Perspective',     fr: 'Perspective de Vie',         chakra: 'c7',
    de: 'Identify recurring themes and cycles that shape your personal evolution.',
    df: 'Identifiez les thèmes récurrents et les cycles qui façonnent votre évolution personnelle.' },
];

const CHAKRA_COLORS = {
  c3: '#e8c840', c4: '#B8E8C2', c5: '#A8D4F0', c6: '#C5B8F0', c7: '#E8B8F0',
};

// ─── Main Component ──────────────────────
function Astrology() {
  const { lang }   = useLang();
  const navigate   = useNavigate();
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(false);

  const calc = async () => {
    setErr(false); setResult(null);
    if (!dob) { setErr(true); return; }
    const [y, m, d] = dob.split('-').map(Number);
    let h = 12;
    if (tob) { const [hh, mm] = tob.split(':').map(Number); h = hh + mm / 60; }
    const jd   = toJD(y, m, d, h);
    const sun  = signFrom(sunLon(jd));
    const moon = signFrom(moonLon(jd));
    const planets = [
      { lEN: 'Mercury', lFR: 'Mercure', icon: PlanetIcons.Mercury, s: signFrom(pLon('Mercury', jd)) },
      { lEN: 'Venus',   lFR: 'Vénus',   icon: PlanetIcons.Venus,   s: signFrom(pLon('Venus',   jd)) },
      { lEN: 'Mars',    lFR: 'Mars',     icon: PlanetIcons.Mars,    s: signFrom(pLon('Mars',    jd)) },
      { lEN: 'Jupiter', lFR: 'Jupiter',  icon: PlanetIcons.Jupiter, s: signFrom(pLon('Jupiter', jd)) },
      { lEN: 'Saturn',  lFR: 'Saturne',  icon: PlanetIcons.Saturn,  s: signFrom(pLon('Saturn',  jd)) },
    ];
    let asc = null, coord = '';
    if (tob && pob) {
      setLoading(true);
      const geo = await geocode(pob);
      setLoading(false);
      if (geo) {
        asc   = signFrom(calcAsc(jd, geo.lat, geo.lon));
        coord = `${geo.display} · ${Math.abs(geo.lat).toFixed(2)}°${geo.lat >= 0 ? 'N' : 'S'} ${Math.abs(geo.lon).toFixed(2)}°${geo.lon >= 0 ? 'E' : 'W'}`;
      }
    }
    const MEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const MFR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    setResult({ sun, moon, asc, coord, planets, tob,
      name: lang === 'fr'
        ? `Thème Natal — ${MFR[m-1]} ${d}, ${y}`
        : `Birth Chart — ${MEN[m-1]} ${d}, ${y}` });
  };

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Thème Natal & Astrologie | The Idala Family' : 'Birth Chart & Astrology | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Calculez votre thème natal gratuitement et découvrez votre signe solaire, lunaire et ascendant. Réservez une interprétation complète avec Diane Thomas.'
          : 'Calculate your birth chart for free and discover your sun, moon and rising signs. Book a full interpretation session with Diane Thomas.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── SECTION 1 — HERO ── */}
        <section className="astro-hero-v2">
          <div className="astro-hero-v2__inner">
            <div className="astro-hero-v2__text">
              <span className="eyebrow">
                {lang === 'fr' ? 'Thème Natal & Connaissance de Soi' : 'Birth Chart & Self-Understanding'}
              </span>
              <h1 className="astro-hero-v2__title">
                {lang === 'fr' ? 'Astrologie' : 'Astrology'}
              </h1>
              <div className="divider" />
              {lang === 'en' ? (
                <>
                  <p className="astro-hero-v2__body">Astrology is a symbolic system of self-understanding based on the position of the planets at the exact moment of your birth. Using your date, time, and place of birth, a personalized birth chart is calculated, offering a detailed map of your inner landscape. This chart highlights core personality traits, emotional patterns, strengths, challenges, and key life themes.</p>
                  <p className="astro-hero-v2__body">It provides a structured framework to better understand how you think, feel, relate, and evolve over time.</p>
                </>
              ) : (
                <>
                  <p className="astro-hero-v2__body">L'astrologie est un système symbolique de connaissance de soi basé sur la position des planètes au moment exact de votre naissance. À partir de votre date, heure et lieu de naissance, un thème natal personnalisé est calculé, offrant une carte détaillée de votre paysage intérieur. Ce thème met en lumière les traits de personnalité essentiels, les schémas émotionnels, les forces, les défis et les thèmes de vie clés.</p>
                  <p className="astro-hero-v2__body">Il offre un cadre structuré pour mieux comprendre comment vous pensez, ressentez, vous reliez et évoluez dans le temps.</p>
                </>
              )}
            </div>
            <div className="astro-hero-v2__visual">
              <div className="astro-orb-v2">
                <svg viewBox="0 0 80 80" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity=".8" style={{ width: 64, height: 64 }}>
                  <circle cx="40" cy="40" r="30"/>
                  <circle cx="40" cy="40" r="20"/>
                  <circle cx="40" cy="40" r="8"/>
                  <line x1="40" y1="6" x2="40" y2="14"/>
                  <line x1="40" y1="66" x2="40" y2="74"/>
                  <line x1="6" y1="40" x2="14" y2="40"/>
                  <line x1="66" y1="40" x2="74" y2="40"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                  <line x1="59" y1="59" x2="65" y2="65"/>
                  <line x1="65" y1="15" x2="59" y2="21"/>
                  <line x1="21" y1="59" x2="15" y2="65"/>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 — BENEFITS (ronds) ── */}
        <section className="astro-benefits">
          <div className="astro-benefits__header">
            <h2 className="eyebrow" style={{ textAlign: 'center' }}>
              {lang === 'fr' ? 'Bénéfices de l\'Astrologie' : 'Benefits of Astrology'}
            </h2>
          </div>
          <div className="astro-benefits__grid">
            {BENEFITS.map(b => (
              <div
                key={b.en}
                className="astro-benefit-circle"
                style={{ '--benefit-color': CHAKRA_COLORS[b.chakra] }}
              >
                <div className="astro-benefit-circle__front">
                  <div className="astro-benefit-circle__ring" />
                  <div className="astro-benefit-circle__title">
                    {lang === 'fr' ? b.fr : b.en}
                  </div>
                </div>
                <div className="astro-benefit-circle__back">
                  <p className="astro-benefit-circle__text">
                    {lang === 'fr' ? b.df : b.de}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3 — CALCULATOR ── */}
        <section className="astro-calc-section">
          <div className="calc-inner">
            <div className="calc-header">
              <span className="eyebrow">{lang === 'fr' ? 'Découvrez votre Thème' : 'Discover Your Chart'}</span>
              <h2 className="section-title">
                {lang === 'fr' ? 'Calculateur de Thème Natal' : 'Birth Chart Calculator'}
              </h2>
              <div className="divider divider--center" />
              <p className="astro-calc-intro">
                {lang === 'fr'
                  ? 'Ajoutez votre heure de naissance précise pour un résultat complet.'
                  : 'Add your precise birth time for a complete result.'}
              </p>
            </div>

            <div className="calc-form">
              <div className="form-group">
                <label>{lang === 'fr' ? 'Date de Naissance' : 'Date of Birth'}</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === 'fr' ? 'Heure de Naissance' : 'Time of Birth'}</label>
                <input type="time" value={tob} onChange={e => setTob(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{lang === 'fr' ? 'Lieu de Naissance' : 'Place of Birth'}</label>
                <input type="text" value={pob} onChange={e => setPob(e.target.value)} placeholder="e.g. Paris, France" />
              </div>
            </div>

            <div className="calc-cta">
              <button className="btn btn--gold" onClick={calc} disabled={loading}>
                {loading ? '…' : (lang === 'fr' ? 'Calculer mon Thème' : 'Calculate My Chart')}
              </button>
            </div>

            {err && (
              <p className="error-msg">
                {lang === 'fr' ? 'Veuillez entrer votre date de naissance pour continuer.' : 'Please enter your date of birth to continue.'}
              </p>
            )}

            {/* ── Results ── */}
            {result && (
              <div className="chart-result-v2">
                <div className="chart-result-v2__header">
                  <div className="chart-result-v2__circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" style={{ width: 28, height: 28 }}>
                      <circle cx="12" cy="12" r="9"/>
                      <circle cx="12" cy="12" r="5"/>
                      <circle cx="12" cy="12" r="1.5" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <div className="chart-result-v2__name">{result.name}</div>
                    <div className="chart-result-v2__coords">{result.coord || (result.tob ? `${result.tob} UT` : '')}</div>
                  </div>
                </div>

                {/* Big 3 */}
                <div className="chart-result-v2__big3-label">
                  <span className="eyebrow">{lang === 'fr' ? 'Les 3 Principaux' : 'The Big Three'}</span>
                </div>
                <div className="chart-result-v2__big3">
                  <div className="astro-result-card astro-result-card--highlight">
                    <div className="astro-result-card__icon">{PlanetIcons.Sun}</div>
                    <div className="astro-result-card__label">{lang === 'fr' ? 'Signe Solaire' : 'Sun Sign'}</div>
                    <div className="astro-result-card__sign-icon">{result.sun.icon}</div>
                    <div className="astro-result-card__value">{lang === 'fr' ? result.sun.fr : result.sun.en}</div>
                    <div className="astro-result-card__deg">{result.sun.deg}</div>
                  </div>

                  {result.asc ? (
                    <div className="astro-result-card astro-result-card--highlight">
                      <div className="astro-result-card__icon">{PlanetIcons.Rising}</div>
                      <div className="astro-result-card__label">{lang === 'fr' ? 'Ascendant' : 'Rising Sign'}</div>
                      <div className="astro-result-card__sign-icon">{result.asc.icon}</div>
                      <div className="astro-result-card__value">{lang === 'fr' ? result.asc.fr : result.asc.en}</div>
                      <div className="astro-result-card__deg">{result.asc.deg}</div>
                    </div>
                  ) : (
                    <div className="astro-result-card astro-result-card--muted">
                      <div className="astro-result-card__icon">{PlanetIcons.Rising}</div>
                      <div className="astro-result-card__label">{lang === 'fr' ? 'Ascendant' : 'Rising Sign'}</div>
                      <div className="astro-result-card__value astro-result-card__value--small">
                        {lang === 'fr' ? 'Heure & lieu requis' : 'Time & place required'}
                      </div>
                    </div>
                  )}

                  <div className="astro-result-card astro-result-card--highlight">
                    <div className="astro-result-card__icon">{PlanetIcons.Moon}</div>
                    <div className="astro-result-card__label">{lang === 'fr' ? 'Signe Lunaire' : 'Moon Sign'}</div>
                    <div className="astro-result-card__sign-icon">{result.moon.icon}</div>
                    <div className="astro-result-card__value">{lang === 'fr' ? result.moon.fr : result.moon.en}</div>
                    <div className="astro-result-card__deg">{result.moon.deg}</div>
                  </div>
                </div>

                {/* Planets */}
                <div className="chart-result-v2__big3-label" style={{ marginTop: 24 }}>
                  <span className="eyebrow">{lang === 'fr' ? 'Planètes Personnelles' : 'Personal Planets'}</span>
                </div>
                <div className="chart-result-v2__planets">
                  {result.planets.map(p => (
                    <div key={p.lEN} className="astro-result-card astro-result-card--planet">
                      <div className="astro-result-card__icon">{p.icon}</div>
                      <div className="astro-result-card__label">{lang === 'fr' ? p.lFR : p.lEN}</div>
                      <div className="astro-result-card__sign-icon">{p.s.icon}</div>
                      <div className="astro-result-card__value">{lang === 'fr' ? p.s.fr : p.s.en}</div>
                      <div className="astro-result-card__deg">{p.s.deg}</div>
                    </div>
                  ))}
                </div>

                <div className="chart-result-v2__disclaimer">
                   {lang === 'fr' ? (
                      <>
                        Lecture indicative basée sur des calculs astronomiques.<br />
                        Pour une interprétation complète et personnalisée, réservez une séance.
                      </>
                    ) : (
                      <>
                        Indicative reading based on astronomical calculations.<br />
                        For a complete, personalised interpretation, book a full session.
                      </>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button className="btn btn--outline" onClick={() => navigate('/spiritual')}>
                    {lang === 'fr' ? 'Réserver une Séance' : 'Book a Session'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Astrology;