// ─────────────────────────────────────────
//  ASTROLOGY
// ─────────────────────────────────────────

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import charte    from '../assets/chartecarre.jpg';
import Footer from '../components/Footer';

// ─── Zodiac Icons ────────────────────────
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
function keplerSolve(M, e) {
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

function planetXYZ(elems, T) {
  const [L0, L1, a, e0, e1, i0, i1, Om0, Om1, w0, w1] = elems;
  const L  = mod360(L0 + L1 * T) * D2R;
  const e  = e0 + e1 * T;
  const i  = (i0 + i1 * T) * D2R;
  const Om = (Om0 + Om1 * T) * D2R;
  const w  = (w0  + w1  * T) * D2R;
  const M  = mod360((L - w) * 180 / Math.PI) * D2R;
  const E  = keplerSolve(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v  = Math.atan2(yv, xv);
  const r  = Math.sqrt(xv * xv + yv * yv);
  const u  = v + w - Om;
  return {
    x: r * (Math.cos(Om) * Math.cos(u) - Math.sin(Om) * Math.sin(u) * Math.cos(i)),
    y: r * (Math.sin(Om) * Math.cos(u) + Math.cos(Om) * Math.sin(u) * Math.cos(i)),
    z: r * Math.sin(u) * Math.sin(i),
  };
}

const ELEMS = {
  Earth:   [100.464457, 36000.7698278, 1.000001018,  0.01670863, -0.000042037, 0,        0,         174.873174, -0.2410908, 102.937348,  0.3225557],
  Mercury: [252.250906, 149472.6746358, 0.387098310, 0.20563069, -0.000000059, 7.004986, -0.0018215, 48.330893, -0.1254229,  77.456119,  0.1588643],
  Venus:   [181.979801,  58517.8156760, 0.723329820, 0.00677188, -0.000047766, 3.394662, -0.0008568, 76.679920, -0.2780134, 131.563707,  0.0048646],
  Mars:    [355.433275,  19140.2993313, 1.523679342, 0.09340062,  0.000090483, 1.849726, -0.0006011, 49.558093, -0.2950250, 336.060234,  0.4439016],
  Jupiter: [ 34.351519,   3034.9056606, 5.202603209, 0.04849485,  0.000163244, 1.303270, -0.0054966, 100.464441, 0.1767232,  14.331309,  0.2155209],
  Saturn:  [ 50.077444,   1222.1137943, 9.554909192, 0.05550825, -0.000346641, 2.488878,  0.0006218, 113.665524, -0.2566722,  93.057136,  0.5665415],
};

const pLon = (name, jd) => {
  const T     = (jd - 2451545) / 36525;
  const earth = planetXYZ(ELEMS.Earth, T);
  const p     = planetXYZ(ELEMS[name], T);
  return mod360(Math.atan2(p.y - earth.y, p.x - earth.x) * 180 / Math.PI);
};
const calcAsc = (jd, lat, lon) => {
  const T = (jd - 2451545) / 36525;
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
  GMST = mod360(GMST);
  const LST = mod360(GMST + lon);
  const eps = (23.439292 - 0.013004 * T) * D2R;
  const LSTr = LST * D2R;
  const latr = lat * D2R;
  const ascRad = Math.atan2(
    Math.cos(LSTr),
    -(Math.sin(LSTr) * Math.cos(eps) + Math.tan(latr) * Math.sin(eps))
  );
  return mod360(ascRad * (180 / Math.PI));
};

const S_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const S_FR = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];
const signFrom = lon => {
  const i = Math.floor(mod360(lon) / 30), deg = Math.floor(mod360(lon) % 30), min = Math.floor((mod360(lon) % 1) * 60);
  return { en: S_EN[i], fr: S_FR[i], deg: `${deg}° ${min}'`, icon: ZodiacIcons[S_EN[i]] };
};

// ─── Benefits ────────────────────────────
const BENEFITS = [
  {
    fr: 'Connaissance de soi', en: 'Self-Knowledge', chakra: 'c1',
    df: 'Mieux comprendre votre personnalité, vos motivations et vos modes de fonctionnement naturels.',
    de: 'Better understand your personality, your motivations and your natural ways of functioning.',
  },
  {
    fr: 'Clarté émotionnelle', en: 'Emotional Clarity', chakra: 'c2',
    df: 'Identifier votre façon de vivre les émotions, le stress, le changement et les relations.',
    de: 'Identify how you experience emotions, stress, change and relationships.',
  },
  {
    fr: 'Relations', en: 'Relationships', chakra: 'c3',
    df: 'Éclairer vos dynamiques de lien, vos besoins relationnels et vos modes de communication.',
    de: 'Illuminate your relational dynamics, your connection needs and your communication patterns.',
  },
  {
    fr: 'Direction & Potentiel', en: 'Direction & Potential', chakra: 'c4',
    df: 'Repérer vos talents, vos aspirations et vos axes de développement.',
    de: 'Identify your talents, your aspirations and your areas for development.',
  },
  {
    fr: 'Perspective de vie', en: 'Life Perspective', chakra: 'c5',
    df: 'Donner du sens aux cycles, aux thèmes récurrents et aux étapes clés de votre parcours.',
    de: 'Make sense of the cycles, recurring themes and key stages of your journey.',
  },
];

const CHAKRA_COLORS = {
  c1: '#FF6B6B', c2: '#FF9A3C', c3: '#FFD600', c4: '#3DCC70', c5: '#3AA8E0'
};

// ─── Main Component ──────────────────────
function Astrology() {
  const { lang }   = useLang();
  const navigate   = useNavigate();
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');

  // ── Lieu avec autocomplete ──
  const [pob, setPob]                     = useState('');
  const [pobSuggestions, setPobSuggestions] = useState([]);
  const [pobSelected, setPobSelected]       = useState(null);
  const debounceRef                         = useRef(null);

  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(false);

  // Recherche avec debounce 300ms
  const searchPlaces = (query) => {
    setPob(query);
    setPobSelected(null);
    clearTimeout(debounceRef.current);
    if (query.length < 3) { setPobSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await r.json();
        setPobSuggestions(data.map(d => ({
          label: d.display_name.split(',').slice(0, 3).join(','),
          lat: +d.lat,
          lon: +d.lon,
        })));
      } catch { setPobSuggestions([]); }
    }, 300);
  };

  const selectPlace = (s) => {
    setPob(s.label);
    setPobSelected(s);
    setPobSuggestions([]);
  };

const calc = async () => {
  setErr(false); setResult(null);
  if (!dob) { setErr(true); return; }
  const [y, m, d] = dob.split('-').map(Number);
  let h = 12;
  if (tob) { const [hh, mm] = tob.split(':').map(Number); h = hh + mm / 60; }

  let jd;

  if (tob && pobSelected) {
    setLoading(true);
    try {
      const timestamp = Math.floor(new Date(`${dob}T${tob}:00`).getTime() / 1000);
      const tzRes = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=4JQYMDPFJU3E&format=json&by=position&lat=${pobSelected.lat}&lng=${pobSelected.lon}&time=${timestamp}`
      );
      const tzData = await tzRes.json();
      const offsetHours = tzData.gmtOffset / 3600;
      const hUTC = h - offsetHours;
      jd = toJD(y, m, d, hUTC);
    } catch {
      jd = toJD(y, m, d, h);
    }
    setLoading(false);
  } else {
    jd = toJD(y, m, d, h);
  }

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
  if (pobSelected) {
    asc   = signFrom(calcAsc(jd, pobSelected.lat, pobSelected.lon));
    coord = `${pobSelected.label.split(',').slice(0,2).join(',')} · ${Math.abs(pobSelected.lat).toFixed(2)}°${pobSelected.lat >= 0 ? 'N' : 'S'} ${Math.abs(pobSelected.lon).toFixed(2)}°${pobSelected.lon >= 0 ? 'E' : 'W'}`;
  }
  const MEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MFR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  setResult({ sun, moon, asc, coord, planets, tob,
    name: lang === 'fr'
      ? `Thème Astral · ${MFR[m-1]} ${d}, ${y}`
      : `Birth Chart · ${MEN[m-1]} ${d}, ${y}` });
};

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Thème Astral & Astrologie | The Idala Family' : 'Birth Chart & Astrology | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Calculez votre thème astral gratuitement et découvrez votre signe solaire, lunaire et ascendant. Réservez une interprétation complète avec Diane Thomas.'
          : 'Calculate your birth chart for free and discover your sun, moon and rising signs. Book a full interpretation session with Diane Thomas.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── SECTION 1 — HERO ── */}
        <section className="astro-hero-v2">
          <div className="astro-hero-v2__inner">
            <div className="astro-hero-v2__text">
              <h1 className="astro-hero-v2__title">
                {lang === 'fr' ? 'Astrologie' : 'Astrology'}
              </h1>
              <div className="divider" />
              {lang === 'fr' ? (
                <>
                  <p className="astro-hero-v2__body">L'astrologie part d'une idée simple : au moment de votre naissance, le ciel adopte une configuration unique. À partir de votre date, heure et lieu de naissance, un thème astral personnalisé est établi, offrant une cartographie symbolique de votre monde intérieur.</p>
                  <p className="astro-hero-v2__body">Ce thème met en lumière vos tendances de personnalité, vos réflexes émotionnels,<br /> vos ressources, vos zones de tension et les grands questionnements qui jalonnent<br /> votre vie. <br />Il ne dicte pas ce qui va vous arriver ; il éclaire plutôt votre manière de traverser<br /> les expériences.</p>
                  <p className="astro-hero-v2__body">Approchée avec rigueur, l'astrologie devient un cadre structuré pour mieux vous observer : votre façon de penser, de ressentir, de vous relier aux autres, de décider<br /> et d'évoluer au fil du temps.</p>
                  <p className="astro-hero-v2__body">Un outil d'introspection au service de l'alignement, de la clarté et de choix<br /> plus conscients.</p>
                </>
              ) : (
                <>
                  <p className="astro-hero-v2__body">Astrology starts from a simple idea: at the moment of your birth, the sky adopts a unique configuration. From your date, time and place of birth, a personalised birth chart is drawn up, offering a symbolic map of your inner world.</p>
                  <p className="astro-hero-v2__body">This chart illuminates your personality tendencies, emotional reflexes, resources, areas of tension and the key questions that run through your life. It does not dictate<br /> what will happen to you; rather, it sheds light on how you move through experiences.</p>
                  <p className="astro-hero-v2__body">Approached with rigour, astrology becomes a structured framework for better<br /> self-observation: the way you think, feel, connect with others, make decisions<br /> and evolve over time.</p>
                  <p className="astro-hero-v2__body">A tool for introspection in service of alignment, clarity and more conscious choices.</p>
                </>
              )}
            </div>
            <div className="astro-hero-v2__visual">
              <div className="astro-orb-v2">
              <img src={charte} alt="charte astrale" className="astrology-charte" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 — BENEFITS ── */}
        <section className="astro-benefits">
          <div className="astro-benefits__header">
            <span className="eyebrow" style={{ textAlign: 'center' }}>
              {lang === 'fr' ? 'Bénéfices' : 'Benefits'}
            </span>
            <h2 className="astro-benefits__title">
              {lang === 'fr' ? "Qu'est-ce que l\u2019Astrologie peut vous apporter ?" : 'What can Astrology do for you?'}
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
              <h2 className="section-title">
                {lang === 'fr' ? 'Découvrez votre Thème Astral' : 'Discover your Birth Chart'}
              </h2>
              <div className="divider divider--center" />
              <p className="astro-calc-intro">
                {lang === 'fr'
                  ? 'Ajoutez votre heure de naissance précise pour un résultat complet.'
                  : 'Add your precise birth time for a complete result.'}
              </p>
            </div>

            <div className="calc-form">

              {/* Date */}
              <div className="form-group">
                <label>{lang === 'fr' ? 'Date de Naissance' : 'Date of Birth'}</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} onKeyDown={e => e.key === 'Enter' && dob && tob && pobSelected && calc()}
 />
              </div>

              {/* Heure */}
              <div className="form-group">
                <label>{lang === 'fr' ? 'Heure de Naissance' : 'Time of Birth'}</label>
                <input type="time" value={tob} onChange={e => setTob(e.target.value)} onKeyDown={e => e.key === 'Enter' && dob && tob && pobSelected && calc()} />
              </div>

              {/* Lieu avec autocomplete */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label>{lang === 'fr' ? 'Lieu de Naissance' : 'Place of Birth'}</label>
                <input
                  type="text"
                  value={pob}
                  onChange={e => searchPlaces(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && dob && tob && pobSelected && calc()}
                  placeholder={lang === 'fr' ? 'ex. Paris, France' : 'e.g. Paris, France'}
                  autoComplete="off"
                />
                {pobSuggestions.length > 0 && (
                  <ul className="pob-suggestions">
                    {pobSuggestions.map((s, i) => (
                      <li key={i} className="pob-suggestion" onClick={() => selectPlace(s)}>
                        {s.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            {/* Note si lieu tapé mais pas sélectionné */}
            {pob && !pobSelected && tob && (
              <p className="calc-note">
                {lang === 'fr'
                  ? 'Sélectionnez une ville dans la liste pour calculer votre Ascendant.'
                  : 'Select a city from the list to calculate your Rising Sign.'}
              </p>
            )}

            <div className="calc-cta">
              <button className="btn btn--violet-mid" onClick={calc} disabled={loading}>
                {loading ? '…' : (lang === 'fr' ? 'Calculer mon Thème' : 'Calculate My Chart')}
              </button>
            </div>

            {err && (
              <p className="error-msg">
                {lang === 'fr'
                  ? 'Veuillez entrer votre date de naissance pour continuer.'
                  : 'Please enter your date of birth to continue.'}
              </p>
            )}

            {result && (
              <div className="chart-result-v2">
                <div className="chart-result-v2__header">
                  <div className="chart-result-v2__circle">
                    <img src={charte} alt="charte astrale" />
                  </div>
                  <div>
                    <div className="chart-result-v2__name">{result.name}</div>
                    <div className="chart-result-v2__coords">{result.coord || (result.tob ? `${result.tob} UT` : '')}</div>
                  </div>
                </div>

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
                  <button className="btn btn--outline" onClick={() => navigate('/practitioners')}>
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