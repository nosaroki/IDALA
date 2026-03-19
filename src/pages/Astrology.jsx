// ─────────────────────────────────────────
//  ASTROLOGY — real astronomical engine
// ─────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';

// ─── Sign Display Component ─────────────
const S = ({ s, lang }) => <>{s.g} {lang === 'fr' ? s.fr : s.en}</>;

// ─── Astronomical Functions ─────────────
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
  const T    = (jd - 2451545) / 36525,
        GMST = mod360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T),
        LST  = mod360(GMST + lon),
        eps  = (23.439292 - 0.013004 * T) * D2R,
        lstR = LST * D2R, latR = lat * D2R,
        y    = -Math.cos(lstR),
        x    = Math.sin(lstR) * Math.cos(eps) + Math.tan(latR) * Math.sin(eps);
  let asc = Math.atan2(y, x) * (180 / Math.PI);
  if (Math.sin(lstR) < 0) asc += 180; else if (Math.cos(lstR) < 0) asc += 180;
  return mod360(asc);
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
  return { en: S_EN[i], fr: S_FR[i], g: S_GL[i], deg: `${deg}° ${min}'` };
};

// ─── Benefits data ───────────────────────
const BENEFITS = [
  { en: 'Self-Awareness',      fr: 'Connaissance de Soi',       chakra: 'c3', de: 'Gain clearer insight into your personality, motivations, and natural tendencies.',             df: 'Obtenez une vision plus claire de votre personnalité, de vos motivations et de vos tendances naturelles.' },
  { en: 'Emotional Insight',   fr: 'Perspicacité Émotionnelle', chakra: 'c4', de: 'Understand how you process emotions and respond to stress and relationships.',                 df: 'Comprenez comment vous traitez les émotions et répondez au stress et aux relations.' },
  { en: 'Relationship Clarity',fr: 'Clarté Relationnelle',      chakra: 'c5', de: 'Identify compatibility patterns and communication dynamics.',                                  df: 'Identifiez les schémas de compatibilité et les dynamiques de communication.' },
  { en: 'Direction & Strengths',fr:'Direction & Forces',        chakra: 'c6', de: 'Recognize your talents, ambitions, and areas for growth.',                                    df: 'Reconnaissez vos talents, vos ambitions et vos domaines de croissance.' },
  { en: 'Life Perspective',    fr: 'Perspective de Vie',        chakra: 'c7', de: 'Understand recurring themes and cycles shaping your personal evolution.',                     df: 'Comprenez les thèmes récurrents et les cycles qui façonnent votre évolution personnelle.' },
];

// ─── Main Component ─────────────────────
function Astrology() {
  const { lang } = useLang();
  const navigate = useNavigate();
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
    const jd  = toJD(y, m, d, h);
    const sun  = signFrom(sunLon(jd));
    const moon = signFrom(moonLon(jd));
    const planets = [
      { lEN: 'Mercury', lFR: 'Mercure', s: signFrom(pLon('Mercury', jd)) },
      { lEN: 'Venus',   lFR: 'Vénus',   s: signFrom(pLon('Venus',   jd)) },
      { lEN: 'Mars',    lFR: 'Mars',     s: signFrom(pLon('Mars',    jd)) },
      { lEN: 'Jupiter', lFR: 'Jupiter',  s: signFrom(pLon('Jupiter', jd)) },
      { lEN: 'Saturn',  lFR: 'Saturne',  s: signFrom(pLon('Saturn',  jd)) },
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
    setResult({ sun, moon, asc, coord, planets, tob, name: lang === 'fr' ? `Thème Natal — ${MFR[m-1]} ${d}, ${y}` : `Birth Chart — ${MEN[m-1]} ${d}, ${y}` });
  };

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Thème Natal & Astrologie — The Idala Family' : 'Birth Chart & Astrology — The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Calculez votre thème natal gratuitement et découvrez votre signe solaire, lunaire et ascendant. Réservez une interprétation complète avec Diane Szonyi.'
          : 'Calculate your birth chart for free and discover your sun, moon and rising signs. Book a full interpretation session with Diane Szonyi.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── Hero ── */}
        <div className="astro-hero">
          <div>
            <span className="eyebrow">{lang === 'fr' ? 'Thème Natal & Connaissance de Soi' : 'Birth Chart & Self-Understanding'}</span>
            <h1 className="section-title">Astrology</h1>
            <div className="divider" />
            {lang === 'en' ? (
              <>
                <p className="body-text" style={{ marginBottom: 12 }}>Astrology is a system of self-understanding based on the position of the planets at the exact moment of your birth. Using your date, time, and place of birth, a personalized birth chart is calculated. This chart reflects your personality traits, emotional patterns, strengths, challenges, and life themes.</p>
                <p className="body-text" style={{ marginBottom: 12 }}>Astrology offers a structured framework to better understand how you think, feel, relate, and evolve.</p>
                <p className="body-text">Astrology supports conscious growth by helping you navigate life with greater clarity and alignment.</p>
              </>
            ) : (
              <>
                <p className="body-text" style={{ marginBottom: 12 }}>L'astrologie est un système de connaissance de soi basé sur la position des planètes au moment exact de votre naissance. À partir de votre date, heure et lieu de naissance, un thème natal personnalisé est calculé. Ce thème reflète vos traits de personnalité, vos schémas émotionnels, vos forces, vos défis et vos thèmes de vie.</p>
                <p className="body-text" style={{ marginBottom: 12 }}>L'astrologie offre un cadre structuré pour mieux comprendre comment vous pensez, ressentez, vous reliez et évoluez.</p>
                <p className="body-text">L'astrologie soutient la croissance consciente en vous aidant à naviguer dans la vie avec plus de clarté et d'alignement.</p>
              </>
            )}
          </div>
          <div className="astro-visual">
            <div className="astro-orb">✦</div>
            <div className="astro-orb-label">The Mindful Links</div>
          </div>
        </div>

        {/* ── Benefits ── */}
        <div className="benefits-section">
          <div className="benefits-header">
            <span className="eyebrow">{lang === 'fr' ? 'Bénéfices' : 'Benefits'}</span>
            <h2 className="section-title">{lang === 'fr' ? "Ce que l'Astrologie Révèle" : 'What Astrology Reveals'}</h2>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map(b => (
              <div key={b.en} className={`benefit-card benefit-card--${b.chakra}`}>
                <div className="benefit-title">{lang === 'fr' ? b.fr : b.en}</div>
                <p className="body-text">{lang === 'fr' ? b.df : b.de}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calculator ── */}
        <div className="calculator-section">
          <div className="calc-inner">
            <div className="calc-header">
              <span className="eyebrow">{lang === 'fr' ? 'Découvrez votre Thème' : 'Discover Your Chart'}</span>
              <h2 className="section-title">{lang === 'fr' ? 'Calculateur de Thème Natal' : 'Birth Chart Calculator'}</h2>
              <div className="divider divider--center" />
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

            <p className="calc-note">
              {lang === 'fr'
                ? "Pour un Ascendant précis, veuillez indiquer votre heure et ville de naissance. Sans heure, l'Ascendant ne peut pas être déterminé."
                : 'For an accurate Rising Sign, please enter your birth time and city. Without a birth time, Rising Sign cannot be determined.'}
            </p>

            <div className="calc-cta">
              <button className="btn btn--gold" onClick={calc} disabled={loading}>
                {loading ? '…' : (lang === 'fr' ? 'Calculer mon Thème' : 'Calculate My Chart')}
              </button>
            </div>

            {err && <p className="error-msg">{lang === 'fr' ? 'Veuillez entrer votre date de naissance pour continuer.' : 'Please enter your date of birth to continue.'}</p>}

            {/* ── Result ── */}
            {result && (
              <div className="chart-result">
                <div className="result-header">
                  <div className="result-circle">✦</div>
                  <div>
                    <div className="result-name">{result.name}</div>
                    <div className="result-coords">{result.coord || (result.tob ? `${result.tob} UT` : '')}</div>
                  </div>
                </div>

                <div className="result-grid">
                  <div className="result-item result-item--highlight">
                    <div className="result-label">{lang === 'fr' ? 'Signe Solaire' : 'Sun Sign'}</div>
                    <div className="result-value"><S s={result.sun} lang={lang} /></div>
                    <div className="result-degree">{result.sun.deg}</div>
                  </div>

                  {result.asc
                    ? <div className="result-item result-item--highlight">
                        <div className="result-label">{lang === 'fr' ? 'Ascendant' : 'Rising Sign'}</div>
                        <div className="result-value"><S s={result.asc} lang={lang} /></div>
                        <div className="result-degree">{result.asc.deg}</div>
                      </div>
                    : <div className="result-item">
                        <div className="result-label">{lang === 'fr' ? 'Ascendant' : 'Rising Sign'}</div>
                        <div className="result-value" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          {lang === 'fr' ? 'Heure & lieu requis' : 'Time & place required'}
                        </div>
                      </div>
                  }

                  <div className="result-item result-item--highlight">
                    <div className="result-label">{lang === 'fr' ? 'Signe Lunaire' : 'Moon Sign'}</div>
                    <div className="result-value"><S s={result.moon} lang={lang} /></div>
                    <div className="result-degree">{result.moon.deg}</div>
                  </div>

                  {result.planets.map(p => (
                    <div key={p.lEN} className="result-item">
                      <div className="result-label">{lang === 'fr' ? p.lFR : p.lEN}</div>
                      <div className="result-value"><S s={p.s} lang={lang} /></div>
                      <div className="result-degree">{p.s.deg}</div>
                    </div>
                  ))}
                </div>

                <div className="result-disclaimer">
                  {lang === 'fr'
                    ? "Il s'agit d'une lecture indicative basée sur des calculs astronomiques. Pour une interprétation complète et personnalisée, réservez une séance d'astrologie avec Diane."
                    : 'This is an indicative reading based on astronomical calculations. For a complete, personalised interpretation, book a full astrology session with Diane.'}
                </div>

                <div style={{ textAlign: 'center', marginTop: 22 }}>
                  <button className="btn btn--outline" onClick={() => navigate('/spiritual')}>
                    {lang === 'fr' ? 'Réserver une Séance avec Diane' : 'Book a Session with Diane'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

export default Astrology;